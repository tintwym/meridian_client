import { motion } from 'motion/react';
import { Compass, PenLine, MessageCircle, Sparkles } from 'lucide-react';

export type AppTab = 'home' | 'plan' | 'inquire' | 'club';

const TABS: { id: AppTab; label: string; icon: typeof Compass }[] = [
  { id: 'home', label: 'Explore', icon: Compass },
  { id: 'plan', label: 'Plan', icon: PenLine },
  { id: 'inquire', label: 'Inquire', icon: MessageCircle },
  { id: 'club', label: 'Club', icon: Sparkles },
];

interface TabBarProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      className="app-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-paper"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Main"
    >
      <div className="relative mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease }}
              className={`relative flex min-w-14 flex-1 flex-col items-center gap-1 px-1.5 py-1.5 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive ? 'text-atlantic' : 'text-ink/35 hover:text-ink/60'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 transition-[stroke-width] duration-300" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="font-app-sans text-[10px] font-medium tracking-wide">{label}</span>
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-atlantic"
                  transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.7 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
