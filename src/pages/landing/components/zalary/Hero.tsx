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
      className="zl-hero relative flex min-h-[100svh] w-full items-stretch overflow-hidden bg-black pt-20 sm:pt-24 lg:h-screen lg:min-h-[680px] lg:items-center lg:pt-0"
    >
      {/* subtle grid depth */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative grid min-h-[calc(100svh-5rem)] w-full grid-cols-1 items-start lg:h-full lg:grid-cols-12 lg:items-center">
        {/* ─────────────────────────────
            LEFT TEXT — INTERLOCKED LAYER
        ───────────────────────────── */}
        <motion.div
          style={{ y: smoothTextY }}
          className="
            zl-hero-copy
            lg:col-span-5 
            z-20 
            flex items-start lg:items-center
            px-5 pt-10 sm:px-8 sm:pt-12 md:px-10
            lg:ml-[10vw] lg:px-0 lg:pt-0 xl:ml-[14vw]
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
                zl-hero-title
                font-display 
                text-[2.5rem] sm:text-[3.15rem] md:text-[3.65rem] lg:text-[4.25rem] xl:text-[5rem]
                leading-[1.02]
                tracking-normal
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
              className="zl-hero-subtitle mt-4 max-w-md text-[15px] leading-relaxed text-white/60 sm:text-[16.5px]"
            >
              Manage salaries, balances, and payouts with full confidentiality
              and verifiable onchain execution.
            </motion.p>

            <motion.div variants={itemVariant} className="zl-hero-actions mt-8 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="decrypt-hover-btn rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 sm:px-6"
              >
                Launch App
              </Link>

              <a
                href="#how"
                className="decrypt-hover-btn rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:px-6"
              >
                View Demo
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ─────────────────────────────
            RIGHT IMAGE — DEPTH + FADE LAYER
        ───────────────────────────── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-18%] z-0 flex h-[52svh] min-h-[230px] items-end justify-center overflow-hidden opacity-70 lg:pointer-events-auto lg:static lg:col-span-7 lg:h-full lg:min-h-0 lg:items-center lg:justify-start lg:opacity-100">
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
              h-full
              w-full
              object-contain
              object-bottom
              lg:h-[105%]
              lg:w-auto
              lg:object-left
              lg:-translate-x-[6%]
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



