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
    <section className="relative h-[50vh] w-full overflow-hidden bg-[#FE9E15] flex items-center justify-center">
      <div className="mx-auto max-w-[1100px] px-5 md:px-8 w-full h-full">
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="relative overflow-hidden rounded-[16px] px-8 md:px-14 py-10 text-black h-full"
        >
          {/* Glow */}
          <motion.div
            style={{ x: bgX, y: bgY }}
            className="pointer-events-none absolute inset-0 opacity-30"
          >
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />
          </motion.div>

          <div className="relative z-10 flex items-center justify-between gap-10 h-full">
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
                className="text-2xl md:text-4xl lg:text-5xl font-semibold leading-tight"
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
              className="flex flex-col items-center justify-center gap-3 flex-shrink-0"
            >
              <MotionLink
                to="/app"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="decrypt-hover-btn inline-flex items-center gap-2 rounded-none bg-black px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-black/85"
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



