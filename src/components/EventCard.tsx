import { useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import { MapPin, Tag, Plus, Check, ImageOff } from 'lucide-react';
import type { EventActivity } from '../types';

type EventCardProps = {
  activity: EventActivity;
  onAdd: (activity: EventActivity) => void;
  isAdded: boolean;
};

export default function EventCard({ activity, onAdd, isAdded }: EventCardProps): ReactElement {
  const [imgFailed, setImgFailed] = useState(false);
  const preview = activity.features.slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-navy/10 rounded-2xl overflow-hidden shadow-sm hover:border-sage/40 transition-colors flex flex-col h-full"
    >
      <div className="relative h-40 overflow-hidden bg-champagne shrink-0">
        {!imgFailed ? (
          <img
            src={activity.image}
            alt={activity.title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate">
            <ImageOff className="w-7 h-7 opacity-50" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Unavailable</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 bg-white/90 text-navy text-[10px] font-semibold px-2 py-0.5 rounded-full border border-navy/10">
            <Tag className="w-3 h-3 text-sage" />
            {activity.category}
          </span>
          <span className="inline-flex items-center gap-1 bg-navy/90 text-champagne text-[10px] font-bold px-2 py-0.5 rounded-full">
            <MapPin className="w-3 h-3" />
            {activity.location}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-serif text-base font-semibold text-navy leading-snug mb-1.5">
          {activity.title}
        </h3>
        <p className="text-slate text-xs leading-relaxed mb-3 line-clamp-2">{activity.description}</p>
        <ul className="space-y-1 mb-3">
          {preview.map((f) => (
            <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate">
              <Check className="w-3 h-3 text-sage shrink-0 mt-0.5" />
              <span className="line-clamp-1">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-3 border-t border-navy/5 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-wider font-mono text-slate">From</p>
            <p className="font-mono text-sm font-bold text-navy">
              ${activity.basePrice.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate">+${activity.pricePerGuest}/guest</p>
          </div>
          <button
            type="button"
            disabled={isAdded}
            onClick={() => onAdd(activity)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold transition-colors ${
              isAdded
                ? 'bg-sage/15 text-sage cursor-default'
                : 'bg-navy text-white hover:bg-sage cursor-pointer'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
