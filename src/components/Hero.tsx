import { motion } from 'motion/react';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { BRAND } from '../brand';
import localResortImg from '../assets/images/local_resort_luxury_1784113723300.jpg';
import overseasCliffsideImg from '../assets/images/overseas_cliffside_wedding_1784113736506.jpg';
import { imageSrc } from '../lib/imageSrc';

interface HeroProps {
  onLocalClick: () => void;
  onOverseasClick: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ onLocalClick, onOverseasClick }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[85svh] lg:min-h-svh bg-champagne flex flex-col pt-20 pb-12 sm:pb-16 md:pb-20 overflow-hidden"
    >
      <div className="ambient-blur absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-sage/15 rounded-full blur-[140px] pointer-events-none select-none z-0" />
      <div className="ambient-blur absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-[#EADCC9]/35 rounded-full blur-[150px] pointer-events-none select-none z-0" />

      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] md:text-[14rem] font-serif text-sage/5 select-none pointer-events-none font-light z-0 tracking-[0.08em]">
        {BRAND.wordmark}
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-4 lg:py-6 relative z-10">
        <motion.div
          className="lg:col-span-5 flex flex-col justify-center space-y-4 text-left pr-0 lg:pr-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
            }}
            className="inline-flex items-center space-x-2 text-sage font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            <Compass className="w-4 h-4 text-sage" />
            <span>{BRAND.fullName}</span>
          </motion.div>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
            }}
            className="font-serif text-[2.35rem] min-[380px]:text-5xl sm:text-6xl lg:text-7xl font-semibold text-navy tracking-tight leading-[1.05]"
          >
            Flawless Events.
            <br />
            <span className="font-light italic text-sage">Near or Far.</span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
            }}
            className="text-slate text-sm sm:text-base leading-relaxed font-sans max-w-md"
          >
            From intimate local venues to seamless overseas destination weddings, we orchestrate
            every detail — flights, weather, food, and forever.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
            }}
            className="flex flex-col sm:flex-row gap-3 pt-1"
          >
            <button
              id="hero-cta-overseas"
              onClick={onOverseasClick}
              className="flex-1 bg-navy hover:bg-sage text-white text-[11px] sm:text-xs tracking-widest uppercase font-semibold px-4 sm:px-5 py-3.5 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 group shadow-[0_8px_32px_0_rgba(15,23,42,0.15)] cursor-pointer active:scale-[0.99]"
            >
              <span>Plan Overseas</span>
              <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              id="hero-cta-local"
              onClick={onLocalClick}
              className="flex-1 glass-panel hover:bg-white/90 text-navy text-[11px] sm:text-xs tracking-widest uppercase font-semibold px-4 sm:px-5 py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_32px_0_rgba(143,151,121,0.08)] active:scale-[0.99]"
            >
              <span>Explore Local</span>
            </button>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.4, ease } },
            }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-navy/5"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-sage" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate">
                Weather Backup Plan
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sage text-sm font-semibold">★ 4.9</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate">
                250+ Weddings
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:col-span-7 h-80 sm:h-100 lg:h-[min(480px,52vh)] w-full relative grid grid-cols-2 gap-3 md:gap-4 mt-4 lg:mt-0"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.1 }}
        >
          <div
            onClick={onLocalClick}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_16px_40px_rgba(143,151,121,0.2)] transition-shadow duration-500 h-full border border-white/20"
          >
            <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/10 z-10 transition-colors duration-500" />
            <img
              src={imageSrc(localResortImg)}
              alt="Luxurious Local Resort Celebration"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col justify-end text-white">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-champagne mb-1">
                Local Venues
              </span>
              <h3 className="font-serif text-lg md:text-2xl font-medium tracking-tight">
                Resort Elegance
              </h3>
              <p className="text-white/80 text-[11px] mt-1 max-h-0 opacity-0 overflow-hidden group-hover:max-h-16 group-hover:opacity-100 transition-all duration-500">
                Intimate manicured estates, luxury ballrooms, and oceanfront terraces.
              </p>
            </div>
            <div className="absolute top-4 left-4 glass-panel border border-white/40 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-navy rounded-full z-20">
              Local Expertise
            </div>
          </div>

          <div
            onClick={onOverseasClick}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_16px_40px_rgba(143,151,121,0.2)] transition-shadow duration-500 h-full mt-4 lg:mt-6 border border-white/20"
          >
            <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/10 z-10 transition-colors duration-500" />
            <img
              src={imageSrc(overseasCliffsideImg)}
              alt="Breathtaking Overseas Cliffside Wedding"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col justify-end text-white">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-champagne mb-1">
                Destination Weddings
              </span>
              <h3 className="font-serif text-lg md:text-2xl font-medium tracking-tight">
                Santorini & Amalfi
              </h3>
              <p className="text-white/80 text-[11px] mt-1 max-h-0 opacity-0 overflow-hidden group-hover:max-h-16 group-hover:opacity-100 transition-all duration-500">
                From cliffside infinity altars to sunset ocean vistas. Full legal registry prep.
              </p>
            </div>
            <div className="absolute top-4 left-4 bg-navy/85 backdrop-blur-md border border-white/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-white rounded-full z-20">
              World Travel
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
