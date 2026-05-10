import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

import {
  containerVariant,
  fadeUpVariant,
  itemVariant,
  VP,
} from "../../lib/animations";

const MotionLink = motion(Link);

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 80, damping: 22 });
  const smoothY = useSpring(y, { stiffness: 80, damping: 22 });

  const bgX = useTransform(smoothX, [-200, 200], ["-8%", "8%"]);
  const bgY = useTransform(smoothY, [-200, 200], ["-8%", "8%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <section className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden bg-[#FE9E15] py-10 md:min-h-[380px]">
      <div className="mx-auto w-full max-w-[1100px] px-5 md:px-8">
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="relative overflow-hidden rounded-[16px] px-0 py-2 text-black sm:px-3 md:px-6"
        >
          {/* Glow */}
          <motion.div
            style={{ x: bgX, y: bgY }}
            className="pointer-events-none absolute inset-0 opacity-30"
          >
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />
          </motion.div>

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center md:gap-10">
            {/* LEFT */}
            <div className="flex-1 max-w-[700px]">
              <motion.div
                variants={itemVariant}
                className="mb-3 flex items-center gap-2"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/55">
                  Launch Zalary
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUpVariant}
                className="text-2xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-normal"
              >
                Run your first private payroll.
                <span className="block text-black/70">
                  Encrypted. Onchain. Instant.
                </span>
              </motion.h2>

              <motion.p
                variants={itemVariant}
                className="mt-5 text-sm md:text-base leading-relaxed text-black/70"
              >
                Manage salaries and pay your team in USDC with full
                confidentiality, powered by Zama FHE and executed on Base.
              </motion.p>
            </div>

            {/* RIGHT CTA */}
            <motion.div
              variants={itemVariant}
              className="flex w-full flex-shrink-0 flex-col items-stretch justify-center gap-3 sm:w-auto sm:items-center"
            >
              <MotionLink
                to="/app"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="decrypt-hover-btn inline-flex items-center justify-center gap-2 rounded-none bg-black px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-black/85"
              >
                Launch App
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </MotionLink>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



