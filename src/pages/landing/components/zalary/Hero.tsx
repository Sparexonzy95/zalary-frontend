import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

import {
  containerVariant,
  fadeUpVariant,
  itemVariant,
} from "../../lib/animations";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  /* ─────────────────────────────
     PARALLAX DEPTH SYSTEM
  ───────────────────────────── */

  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const smoothImgY = useSpring(imgY, { stiffness: 60, damping: 20 });
  const smoothTextY = useSpring(textY, { stiffness: 80, damping: 25 });

  /* ─────────────────────────────
     ADAPTIVE CINEMATIC FADE
  ───────────────────────────── */

  const fadeStrength = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.75, 0.35, 0.1]
  );

  return (
    <section
      ref={ref}
      className="relative h-screen w-full overflow-hidden bg-black flex items-center"
    >
      {/* subtle grid depth */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* ─────────────────────────────
            LEFT TEXT — INTERLOCKED LAYER
        ───────────────────────────── */}
        <motion.div
          style={{ y: smoothTextY }}
          className="
            lg:col-span-5 
            z-20 
            flex items-center
            ml-[6vw] lg:ml-[14vw]
            mix-blend-normal
          "
        >
          <motion.div
            variants={containerVariant}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            <motion.h1
              variants={fadeUpVariant}
              className="
                font-display 
                text-[clamp(2rem,10vw,3.8rem)]
                leading-[1.02]
                tracking-[-0.04em]
                text-white
              "
            >
              <span className="text-[#E28A0C]">Private payroll</span>
              <br />
              infrastructure
              <br />
              for modern finance.
            </motion.h1>

            <motion.p
              variants={itemVariant}
              className="mt-4 max-w-md text-[16.5px] leading-relaxed text-white/60"
            >
              Manage salaries, balances, and payouts with full confidentiality
              and verifiable onchain execution.
            </motion.p>

            <motion.div variants={itemVariant} className="mt-8 flex gap-3">
              <Link
                to="/app"
                className="decrypt-hover-btn rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Launch App
              </Link>

              <a
                href="#how"
                className="decrypt-hover-btn rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View Demo
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ─────────────────────────────
            RIGHT IMAGE — DEPTH + FADE LAYER
        ───────────────────────────── */}
        <div className="lg:col-span-7 h-full relative flex items-center justify-start overflow-hidden">
          {/* adaptive cinematic fade */}
          <motion.div
            style={{ opacity: fadeStrength }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-black via-black/40 to-transparent" />
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black via-black/40 to-transparent" />
          </motion.div>

          {/* image layer */}
          <motion.img
            src="https://res.cloudinary.com/dzi3bfl4r/image/upload/v1777235526/ChatGPT_Image_Apr_26_2026_08_57_37_PM_fnh48f.png"
            alt="Zalary private payroll visual"
            style={{
              y: smoothImgY,
              scale: imgScale,
            }}
            className="
              h-[105%]
              w-auto
              object-contain
              object-left
              -translate-x-[6%]
              z-0
            "
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </section>
  );
}



