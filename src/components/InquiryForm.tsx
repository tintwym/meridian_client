import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Mail, Send, Copy, CheckCircle } from 'lucide-react';
import type { PackageLineItem } from '../types';
import { buildInquiryMailto, buildInquiryPackageText, downloadTextFile } from '../lib/export';

interface InquiryFormProps {
  plannerName: string;
  items: PackageLineItem[];
  total: number;
  deposit?: number;
  initialName?: string;
  initialEmail?: string;
  initialMessage?: string;
}

export default function InquiryForm({
  plannerName,
  items,
  total,
  deposit,
  initialName = '',
  initialEmail = '',
  initialMessage = '',
}: InquiryFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const disabled = items.length === 0;

  const payload = () => ({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    message: message.trim() || undefined,
    plannerName,
    items,
    total,
    deposit,
  });

  const handleMailto = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setHint(null);
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    const data = payload();
    const { href, truncated } = buildInquiryMailto(data);
    const fullText = buildInquiryPackageText(data);

    if (truncated) {
      try {
        await navigator.clipboard.writeText(fullText);
        setHint('Full agenda copied — paste it into the email body.');
      } catch {
        downloadTextFile(
          `${plannerName.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'meridian'}-inquiry.txt`,
          fullText,
          'text/plain;charset=utf-8',
        );
        setError('Clipboard blocked. Full agenda downloaded — attach it to your email.');
        return;
      }
    }

    window.location.href = href;
  };

  const handleCopy = async () => {
    setError(null);
    setHint(null);
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required before copying.');
      return;
    }
    try {
      await navigator.clipboard.writeText(buildInquiryPackageText(payload()));
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  return (
    <div className="bg-white border border-navy/10 rounded-2xl p-5 shadow-sm" id="inquiry-handoff-form">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 bg-sage/15 rounded-lg">
          <Mail className="w-4 h-4 text-sage" />
        </div>
        <h3 className="font-serif font-semibold text-navy">Request a Proposal</h3>
      </div>
      <p className="text-[10px] text-slate uppercase tracking-wider font-mono mb-4">
        Send your Meridian package agenda to our planners
      </p>

      <form onSubmit={handleMailto} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-champagne border border-navy/10 rounded-xl text-xs text-navy focus:outline-none focus:ring-1 focus:ring-sage disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate mb-1">
              Email
            </label>
            <input
              type="email"
              required
              disabled={disabled}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-champagne border border-navy/10 rounded-xl text-xs text-navy focus:outline-none focus:ring-1 focus:ring-sage disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate mb-1">
            Phone <span className="normal-case font-medium text-slate/70">(optional)</span>
          </label>
          <input
            type="tel"
            disabled={disabled}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-champagne border border-navy/10 rounded-xl text-xs text-navy focus:outline-none focus:ring-1 focus:ring-sage disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate mb-1">
            Message <span className="normal-case font-medium text-slate/70">(optional)</span>
          </label>
          <textarea
            rows={3}
            disabled={disabled}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Preferred dates, budget notes, or questions…"
            className="w-full px-3 py-2 bg-champagne border border-navy/10 rounded-xl text-xs text-navy placeholder:text-slate/50 focus:outline-none focus:ring-1 focus:ring-sage resize-none disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-semibold" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-sage font-semibold" role="status">
            {hint}
          </p>
        )}

        {disabled ? (
          <p className="text-xs text-slate">Add at least one package line before requesting a proposal.</p>
        ) : (
          <p className="text-[11px] text-slate">
            Your package ({items.length} item{items.length === 1 ? '' : 's'} · $
            {total.toLocaleString()}
            {typeof deposit === 'number' ? ` · deposit $${deposit.toLocaleString()}` : ''}) will be
            attached.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="submit"
            disabled={disabled}
            className={`py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
              disabled
                ? 'bg-champagne text-slate border border-navy/10 cursor-not-allowed'
                : 'bg-navy hover:bg-sage text-white cursor-pointer'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Send Inquiry
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleCopy}
            className={`py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border ${
              disabled
                ? 'bg-champagne text-slate border-navy/10 cursor-not-allowed'
                : 'border-sage text-sage hover:bg-sage/10 cursor-pointer'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Package
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
