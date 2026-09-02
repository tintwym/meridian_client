import { CloudSun, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { EventPlanResponse } from '../../types';

interface WeatherContingencyCardProps {
  forecast: EventPlanResponse['weatherForecast'];
}

export default function WeatherContingencyCard({ forecast }: WeatherContingencyCardProps) {
  const needsBackup = forecast.indoorContingencyNeeded;

  return (
    <section className="rounded-xl border border-ink/10 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <CloudSun className="mt-0.5 h-5 w-5 shrink-0 text-atlantic" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-app-sans text-[11px] font-medium tracking-[0.18em] text-atlantic uppercase">
            Weather & contingency
          </p>
          <p className="font-app-display text-xl leading-tight text-ink">
            {forecast.temperatureAvg}
            <span className="font-app-sans text-sm font-normal text-ink/55"> · {forecast.conditions}</span>
          </p>
          <p className="font-app-sans text-sm leading-relaxed text-ink/65">{forecast.advice}</p>

          <div
            className={`mt-2 flex items-start gap-2 border px-3 py-2.5 ${
              needsBackup ? 'border-atlantic/30 bg-atlantic/5' : 'border-ink/8 bg-paper'
            }`}
          >
            {needsBackup ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-atlantic" />
            ) : (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-atlantic" />
            )}
            <div>
              <p className="font-app-sans text-[11px] font-semibold tracking-wide text-ink">
                {needsBackup ? 'Indoor backup recommended' : 'Outdoor-friendly outlook'}
              </p>
              <p className="mt-0.5 font-app-sans text-xs leading-relaxed text-ink/60">
                {forecast.contingencyPlan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
