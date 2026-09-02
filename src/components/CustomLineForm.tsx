import { useState, type FormEvent } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { PackageCategory, PackageLineItem, PackageLocation } from '../types';
import { defaultDurationMinutes } from '../lib/schedule';
import { linePrice } from '../lib/pricing';

interface CustomLineFormProps {
  defaultGuests: number;
  defaultLocation: PackageLocation;
  defaultDate: string;
  onAdd: (item: Omit<PackageLineItem, 'id'>) => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CustomLineForm({
  defaultGuests,
  defaultLocation,
  defaultDate,
  onAdd,
}: CustomLineFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PackageCategory>('Activities');
  const [location, setLocation] = useState<PackageLocation>(defaultLocation);
  const [baseCost, setBaseCost] = useState(500);
  const [pricePerGuest, setPricePerGuest] = useState(25);
  const [guests, setGuests] = useState(defaultGuests);
  const [date, setDate] = useState(defaultDate || todayISO());
  const [time, setTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [ok, setOk] = useState(false);

  const estimated = linePrice(baseCost, pricePerGuest, guests);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category,
      location,
      date,
      time,
      guests,
      notes,
      basePrice: baseCost,
      pricePerGuest,
      calculatedPrice: estimated,
      durationMinutes: defaultDurationMinutes(category),
      kind:
        category === 'Stays' ? 'stay' : category === 'Transfers' ? 'transfer' : 'event',
      venueKey: `custom:${location}:${category}`,
    });
    setTitle('');
    setNotes('');
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-navy/10 bg-champagne/60 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-sage" />
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-navy">Custom Line Item</h3>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Line title"
        required
        className="w-full p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy focus:outline-none focus:border-sage"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PackageCategory)}
          className="appearance-none p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy"
        >
          <option value="Weddings">Weddings</option>
          <option value="Dinners">Dinners</option>
          <option value="Activities">Activities</option>
          <option value="Corporate">Corporate</option>
          <option value="Stays">Stays</option>
          <option value="Transfers">Transfers</option>
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value as PackageLocation)}
          className="appearance-none p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy"
        >
          <option value="Local">Local</option>
          <option value="Overseas">Overseas</option>
          <option value="Both">Both</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-[10px] text-slate space-y-1">
          <span className="block uppercase tracking-wider font-mono">Base</span>
          <input
            type="number"
            min={0}
            value={baseCost}
            onChange={(e) => setBaseCost(Number(e.target.value))}
            className="w-full p-2 bg-white border border-navy/10 rounded-xl text-xs"
          />
        </label>
        <label className="text-[10px] text-slate space-y-1">
          <span className="block uppercase tracking-wider font-mono">/Guest</span>
          <input
            type="number"
            min={0}
            value={pricePerGuest}
            onChange={(e) => setPricePerGuest(Number(e.target.value))}
            className="w-full p-2 bg-white border border-navy/10 rounded-xl text-xs"
          />
        </label>
        <label className="text-[10px] text-slate space-y-1">
          <span className="block uppercase tracking-wider font-mono">Guests</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full p-2 bg-white border border-navy/10 rounded-xl text-xs"
          />
        </label>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes (optional)"
        className="w-full p-2.5 bg-white border border-navy/10 rounded-xl text-xs text-navy resize-none"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold text-navy">
          Est. ${estimated.toLocaleString()}
        </span>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-navy hover:bg-sage text-white text-[10px] uppercase tracking-wider font-bold px-3.5 py-2 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {ok ? 'Added' : 'Add Line'}
        </button>
      </div>
    </form>
  );
}
