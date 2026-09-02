import type { EventPlanResponse, PackageLineItem } from '../types';
import { computePackageTotals } from './pricing';
import {
  formatDisplayDate,
  getItemDurationMinutes,
  getItemWindow,
  groupByDate,
  expandStaysAcrossNights,
  timeToMinutes,
} from './schedule';
import { kindLabel } from './packageLines';

const ICS_TZID = 'UTC';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIcsLocal(date: string, minutesFromMidnight: number): string {
  const dayOffset = Math.floor(minutesFromMidnight / (24 * 60));
  const mins = ((minutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
  let targetDate = date;
  if (dayOffset !== 0) {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d + dayOffset);
    targetDate = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }
  const [y, mo, d] = targetDate.split('-');
  const h = Math.floor(mins / 60);
  const mi = mins % 60;
  return `${y}${mo}${d}T${pad(h)}${pad(mi)}00`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    const budget = first ? 75 : 74;
    let end = Math.min(offset + budget, bytes.length);
    if (end < bytes.length) {
      while (end > offset && (bytes[end] & 0xc0) === 0x80) end--;
      if (end > offset && bytes[end] >= 0xc0) {
        end--;
        while (end > offset && (bytes[end] & 0xc0) === 0x80) end--;
      }
    }
    if (end <= offset) end = Math.min(offset + 1, bytes.length);
    const chunk = decoder.decode(bytes.subarray(offset, end));
    parts.push(first ? chunk : ` ${chunk}`);
    offset = end;
    first = false;
  }
  return parts.join('\r\n');
}

export function buildIcsCalendar(plannerName: string, items: PackageLineItem[]): string {
  const stamp = new Date();
  const dtStamp = `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}${pad(stamp.getUTCSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meridian Atelier//Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(plannerName)}`,
    `X-WR-TIMEZONE:${ICS_TZID}`,
  ];

  for (const item of items) {
    const { start, end } = getItemWindow(item);
    const kindLabelText = kindLabel(item.kind, item.category);
    const descriptionParts = [
      `Type: ${kindLabelText} — ${item.category}`,
      `Scale: ${item.location}`,
      `Guests: ${item.guests}`,
      `Estimate: $${item.calculatedPrice.toLocaleString()}`,
    ];
    if (item.fromLabel && item.toLabel) {
      descriptionParts.push(`Route: ${item.fromLabel} → ${item.toLabel}`);
    }
    if (item.nights) descriptionParts.push(`Nights: ${item.nights}`);
    if (item.notes.trim()) descriptionParts.push(`Notes: ${item.notes.trim()}`);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${item.id}@meridian-atelier`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${toIcsLocal(item.date, start)}Z`);
    lines.push(`DTEND:${toIcsLocal(item.date, end)}Z`);
    lines.push(`SUMMARY:${escapeIcsText(item.title)}`);
    lines.push(`LOCATION:${escapeIcsText(`${item.location} — Meridian Atelier`)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadIcs(plannerName: string, items: PackageLineItem[]) {
  const safeName = plannerName.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian-agenda';
  const ics = buildIcsCalendar(plannerName, items);
  downloadTextFile(`${safeName}.ics`, ics, 'text/calendar;charset=utf-8');
}

export function buildAgendaPlainText(plannerName: string, items: PackageLineItem[]): string {
  const expanded = expandStaysAcrossNights(items);
  const sorted = [...expanded].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const totals = computePackageTotals(items);

  const lines: string[] = [
    'Meridian Atelier — Package Agenda',
    plannerName,
    `Generated: ${new Date().toLocaleString()}`,
    `Estimated total: $${totals.grandTotal.toLocaleString()}`,
    `Reservation deposit (25%): $${totals.deposit.toLocaleString()}`,
    '',
  ];

  if (sorted.length > 0) {
    lines.push('— Package lines —');
    for (const item of sorted) {
      const mins = getItemDurationMinutes(item);
      const hoursLabel =
        item.kind === 'stay'
          ? item.calculatedPrice > 0
            ? `${item.nights ?? 1} night package`
            : 'stay night'
          : mins % 60 === 0
            ? `${mins / 60}h`
            : `${(mins / 60).toFixed(1)}h`;
      const label = kindLabel(item.kind, item.category);
      lines.push(`${formatDisplayDate(item.date)} · ${item.time} (~${hoursLabel})`);
      lines.push(`${item.title} · ${item.location}`);
      const priceBit =
        item.calculatedPrice > 0 ? ` · $${item.calculatedPrice.toLocaleString()}` : '';
      lines.push(`${label} · ${item.guests} guests${priceBit}`);
      if (item.fromLabel && item.toLabel) {
        lines.push(`Route: ${item.fromLabel} → ${item.toLabel}`);
      }
      if (item.notes.trim() && item.calculatedPrice > 0) lines.push(`Notes: ${item.notes.trim()}`);
      lines.push('');
    }
  }

  lines.push(
    `Breakdown — Events $${totals.eventsTotal.toLocaleString()} · Experiences $${totals.experiencesTotal.toLocaleString()} · Stays $${totals.staysTotal.toLocaleString()} · Transfers $${totals.transfersTotal.toLocaleString()}`,
  );

  return lines.join('\n');
}

/** Opens a styled print layout — use the browser “Save as PDF” for a polished package PDF. */
export function downloadPackagePdf(
  plannerName: string,
  items: PackageLineItem[],
  locationName?: string,
) {
  const html = buildPackagePrintHtml(plannerName, items, locationName);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!w) {
    downloadPackagePdfFile(plannerName, items, locationName);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* user can print manually */
    }
  }, 350);
}

/** Fallback: download a plain-text PDF file. */
export function downloadPackagePdfFile(
  plannerName: string,
  items: PackageLineItem[],
  locationName?: string,
) {
  const text = buildAgendaPlainText(plannerName, items);
  const header = [
    'Meridian Atelier — Package PDF',
    locationName ? `Location: ${locationName}` : null,
    '',
  ]
    .filter(Boolean)
    .join('\n');
  const full = `${header}${text}`;
  const safeName = plannerName.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian-package';
  const bytes = buildSimplePdf(toPdfSafeText(full));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.pdf`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPackagePrintHtml(
  plannerName: string,
  items: PackageLineItem[],
  locationName?: string,
): string {
  const totals = computePackageTotals(items);
  const groups = groupByDate(items);
  const rows = groups
    .map((g) => {
      const dayRows = g.items
        .map((item) => {
          const price =
            item.calculatedPrice > 0
              ? `$${item.calculatedPrice.toLocaleString()}`
              : '—';
          return `<tr>
            <td>${escapeHtml(item.time)}</td>
            <td><strong>${escapeHtml(item.title)}</strong><br/><span class="muted">${escapeHtml(kindLabel(item.kind, item.category))} · ${item.guests} guests</span></td>
            <td class="right">${price}</td>
          </tr>`;
        })
        .join('');
      return `<h2>${escapeHtml(formatDisplayDate(g.date))}</h2>
        <table><thead><tr><th>Time</th><th>Line</th><th class="right">Est.</th></tr></thead>
        <tbody>${dayRows}</tbody></table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${escapeHtml(plannerName)} — Meridian Atelier</title>
<style>
  @page { margin: 18mm; }
  body { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; color: #1a2332; background: #f7f4ef; margin: 0; padding: 32px; }
  h1 { font-size: 28px; font-weight: 500; margin: 0 0 4px; }
  .brand { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #2a5a6b; font-family: system-ui, sans-serif; font-weight: 700; }
  .meta { font-family: system-ui, sans-serif; font-size: 12px; color: #5c6570; margin-bottom: 24px; }
  h2 { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #2a5a6b; font-family: system-ui, sans-serif; margin: 28px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; background: #fff; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e0d5; font-size: 13px; vertical-align: top; }
  th { font-family: system-ui, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5c6570; }
  .right { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; }
  .muted { color: #5c6570; font-size: 11px; font-family: system-ui, sans-serif; }
  .totals { margin-top: 28px; padding: 16px; background: #1a2332; color: #f7f4ef; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-family: system-ui, sans-serif; font-size: 12px; }
  .totals strong { font-size: 18px; display: block; margin-top: 2px; }
  @media print { body { background: white; padding: 0; } .noprint { display: none; } }
</style></head><body>
  <p class="brand">Meridian Atelier · Package</p>
  <h1>${escapeHtml(plannerName)}</h1>
  <p class="meta">${escapeHtml(locationName || '')} · Generated ${escapeHtml(new Date().toLocaleString())}</p>
  ${rows || '<p class="muted">No package lines yet.</p>'}
  <div class="totals">
    <div>Events<strong>$${totals.eventsTotal.toLocaleString()}</strong></div>
    <div>Experiences<strong>$${totals.experiencesTotal.toLocaleString()}</strong></div>
    <div>Stays<strong>$${totals.staysTotal.toLocaleString()}</strong></div>
    <div>Transfers<strong>$${totals.transfersTotal.toLocaleString()}</strong></div>
    <div>Grand total<strong>$${totals.grandTotal.toLocaleString()}</strong></div>
    <div>Deposit 25%<strong>$${totals.deposit.toLocaleString()}</strong></div>
  </div>
  <p class="meta noprint" style="margin-top:20px">Use Print → Save as PDF for a polished file. Popup blocked? A text PDF downloads instead.</p>
</body></html>`;
}

function pdfEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Map common Unicode to WinAnsi-safe ASCII for built-in Helvetica. */
function toPdfSafeText(input: string): string {
  return input
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
}

/** Helvetica text PDF — wraps long lines and paginates. */
function buildSimplePdf(content: string): Uint8Array {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const fontSize = 10;
  const lineHeight = 14;
  const maxWidthChars = 88;

  const rawLines = content.split('\n');
  const wrapped: string[] = [];
  for (const line of rawLines) {
    if (line.length <= maxWidthChars) {
      wrapped.push(line);
      continue;
    }
    let rest = line;
    while (rest.length > maxWidthChars) {
      let breakAt = rest.lastIndexOf(' ', maxWidthChars);
      if (breakAt < 40) breakAt = maxWidthChars;
      wrapped.push(rest.slice(0, breakAt));
      rest = rest.slice(breakAt).trimStart();
    }
    if (rest) wrapped.push(rest);
  }

  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['(empty package)']);

  const objs: { n: number; body: string }[] = [];
  let n = 1;
  const catalogN = n++;
  const pagesN = n++;
  const fontN = n++;

  const pageRefs: number[] = [];
  const builtPages: { pageN: number; contentN: number; lines: string[] }[] = [];
  for (const pageLines of pages) {
    const contentN = n++;
    const pageN = n++;
    pageRefs.push(pageN);
    builtPages.push({ pageN, contentN, lines: pageLines });
  }

  objs.push({
    n: catalogN,
    body: `<< /Type /Catalog /Pages ${pagesN} 0 R >>`,
  });
  objs.push({
    n: pagesN,
    body: `<< /Type /Pages /Kids [${pageRefs.map((p) => `${p} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`,
  });
  objs.push({
    n: fontN,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  });

  for (const page of builtPages) {
    const contentLines = [
      'BT',
      `/F1 ${fontSize} Tf`,
      `${margin} ${pageHeight - margin} Td`,
      `${lineHeight} TL`,
    ];
    page.lines.forEach((line, idx) => {
      const safe = pdfEscape(line.slice(0, 200));
      if (idx === 0) contentLines.push(`(${safe}) Tj`);
      else contentLines.push(`T* (${safe}) Tj`);
    });
    contentLines.push('ET');
    const stream = contentLines.join('\n');
    objs.push({
      n: page.contentN,
      body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    });
    objs.push({
      n: page.pageN,
      body: `<< /Type /Page /Parent ${pagesN} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${page.contentN} 0 R /Resources << /Font << /F1 ${fontN} 0 R >> >> >>`,
    });
  }

  objs.sort((a, b) => a.n - b.n);
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objs) {
    offsets[obj.n] = pdf.length;
    pdf += `${obj.n} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogN} 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  plannerName: string;
  items: PackageLineItem[];
  total: number;
  deposit?: number;
}

const MAILTO_SAFE_LIMIT = 1800;
const INQUIRY_TO = 'planner@meridianatelier.com';

export function buildInquiryPackageText(payload: InquiryPayload): string {
  return [
    `Inquiry from ${payload.name} <${payload.email}>`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    payload.message?.trim() ? `Message:\n${payload.message.trim()}` : null,
    '',
    '--- Package ---',
    buildAgendaPlainText(payload.plannerName, payload.items),
    `Grand total estimate: $${payload.total.toLocaleString()}`,
    typeof payload.deposit === 'number'
      ? `Reservation deposit (25%): $${payload.deposit.toLocaleString()}`
      : null,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function buildInquiryMailto(
  payload: InquiryPayload,
  toAddress = INQUIRY_TO,
): { href: string; truncated: boolean } {
  const subject = encodeURIComponent(`Inquiry: ${payload.plannerName} — Meridian Atelier`);
  const fullBody = buildInquiryPackageText(payload);
  const encodedFull = encodeURIComponent(fullBody);
  const baseLen = `mailto:${toAddress}?subject=${subject}&body=`.length;

  if (baseLen + encodedFull.length <= MAILTO_SAFE_LIMIT) {
    return { href: `mailto:${toAddress}?subject=${subject}&body=${encodedFull}`, truncated: false };
  }

  const shortBody = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    '',
    payload.message?.trim() || null,
    '',
    `Package: ${payload.items.length} items · est. $${payload.total.toLocaleString()}`,
    '(Full package was copied to your clipboard — please paste it below.)',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    href: `mailto:${toAddress}?subject=${subject}&body=${encodeURIComponent(shortBody)}`,
    truncated: true,
  };
}

/** Plain-text summary of an AI event plan (share / download). */
export function buildPlanSummaryText(plan: EventPlanResponse): string {
  const lines: string[] = [
    'Meridian Atelier — Event Blueprint',
    plan.title,
    plan.tagline,
    '',
    `Location: ${plan.location}`,
    `Budget: ${plan.estimatedBudgetRange}`,
    '',
    '— Itinerary —',
  ];

  for (const step of plan.itinerary) {
    lines.push(`${step.time} · ${step.activity}`);
    lines.push(step.description);
    lines.push('');
  }

  lines.push('— Weather & contingency —');
  lines.push(`${plan.weatherForecast.temperatureAvg} · ${plan.weatherForecast.conditions}`);
  lines.push(plan.weatherForecast.advice);
  if (plan.weatherForecast.indoorContingencyNeeded) {
    lines.push(`Contingency: ${plan.weatherForecast.contingencyPlan}`);
  }
  lines.push('');
  lines.push('— Checklist —');
  for (const item of plan.eventChecklist) {
    lines.push(`• ${item}`);
  }

  return lines.join('\n');
}

export async function shareOrDownloadPlan(plan: EventPlanResponse): Promise<'shared' | 'downloaded' | 'copied'> {
  const text = buildPlanSummaryText(plan);
  const title = `${plan.title} — Meridian Atelier`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      // User cancel → fall through to download/copy.
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }

  try {
    downloadTextFile(
      `${plan.title.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian-plan'}.txt`,
      text,
      'text/plain;charset=utf-8',
    );
    return 'downloaded';
  } catch {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
}

