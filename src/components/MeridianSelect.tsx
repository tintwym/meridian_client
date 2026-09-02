import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export type MeridianSelectOption<T extends string> = {
  value: T;
  label: string;
};

type MeridianSelectProps<T extends string> = {
  value: T;
  options: MeridianSelectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  rounded?: 'full' | 'xl';
  tone?: 'glass' | 'champagne';
  className?: string;
};

const menuEase = [0.22, 1, 0.36, 1] as const;

export default function MeridianSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  rounded = 'full',
  tone = 'glass',
  className = '',
}: MeridianSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const menuRadius = rounded === 'full' ? 'rounded-2xl' : 'rounded-xl';
  const triggerBg =
    tone === 'champagne'
      ? 'bg-champagne focus:bg-white'
      : 'bg-white/40 focus:bg-white';

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-11 w-full items-center appearance-none ${triggerBg} border border-navy/10 ${radius} pl-4 pr-10 text-xs text-navy tracking-wide font-sans text-left focus:outline-none focus:border-sage transition-colors cursor-pointer`}
      >
        <span className="block min-w-0 truncate">{selected?.label}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: menuEase }}
            style={{ transformOrigin: 'top center' }}
            className={`absolute z-50 left-0 right-0 mt-2 ${menuRadius} bg-white border border-navy/10 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] py-1.5 overflow-hidden`}
          >
            {options.map((opt, index) => {
              const isActive = opt.value === value;
              return (
                <motion.li
                  key={opt.value}
                  role="option"
                  aria-selected={isActive}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: 0.03 + index * 0.035,
                    ease: menuEase,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-xs tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sage/15 text-navy font-medium'
                        : 'text-navy/80 hover:bg-champagne hover:text-navy'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-sage shrink-0" aria-hidden />}
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
