import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Lock, KeyRound, Eye, FileCheck2, Shield } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useRef } from "react";
import { containerFast, itemVariant, VP_TIGHT } from "../../lib/animations";

const FEATURES = [
  { title: "Inputs are encrypted before they enter confidential flows", icon: Lock },
  { title: "Permits govern who can decrypt and when", icon: KeyRound },
  { title: "Decrypt-for-view supports user-facing display", icon: Eye },
  { title: "Decrypt-for-tx supports proof-backed transaction actions", icon: FileCheck2 },
  { title: "Privacy is grounded in confidential smart contract logic", icon: Shield },
];

export function Security() {
  const ref = useRef(null);

  /* =========================
     SCROLL EFFECTS
  ========================== */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // FIXED: blur as string (NO .to() issues)
  const blurValue = useTransform(
    scrollYProgress,
    [0, 1],
    ["blur(6px)", "blur(2px)"]
  );

  const opacityValue = useTransform(scrollYProgress, [0, 1], [0.45, 0.7]);

  /* =========================
     MOUSE PARALLAX
  ========================== */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left - rect.width / 2) / 30;
    const y = (e.clientY - rect.top - rect.height / 2) / 30;

    mouseX.set(x);
    mouseY.set(y);
  }

  return (
    <section
      ref={ref}
      id="security"
      className="relative overflow-hidden py-16 md:py-24 lg:py-32"
    >
      {/* base background */}
      <div className="absolute inset-0 bg-[#0b0b0b]" />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-6 md:px-8">
        {/* HEADER */}
        <div className="max-w-xl md:max-w-3xl">
          <SectionHeader
            eyebrow="Security model"
            title={
              <>
                Privacy built for modern systems 
                <span className="text-neutral-500">
                  {" "}secure, scalable and production ready.
                </span>
              </>
            }
          />
        </div>

        {/* =========================
           GLASS CARD
        ========================== */}
        <motion.div
          style={{ y }}
          onMouseMove={handleMouseMove}
          className="relative mt-10 overflow-hidden rounded-[18px] border border-white/10 md:mt-16 md:rounded-[24px]"
        >
          {/* =========================
             BACKGROUND IMAGE (CONTAINED)
          ========================== */}
          <motion.img
            src="https://res.cloudinary.com/dhjmedwbx/image/upload/v1777126506/ChatGPT_Image_Apr_25_2026_03_03_40_PM_ilryu3.png"
            alt=""
            style={{
              x: smoothX,
              y: smoothY,
              filter: blurValue,
              opacity: opacityValue,
            }}
            className="
              absolute inset-0
              w-full h-full object-cover
              scale-[1.1]
            "
          />

          {/* dark overlay for readability */}
          <div className="absolute inset-0 bg-black/55" />

          {/* =========================
             NOISE (FILM GRAIN)
          ========================== */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url('https://grainy-gradients.vercel.app/noise.svg')",
            }}
          />

          {/* =========================
             LIGHT SWEEP
          ========================== */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="h-full w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl" />
          </motion.div>

          {/* =========================
             GLASS LAYER
          ========================== */}
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.04]" />

          {/* inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

          {/* =========================
             CONTENT
          ========================== */}
          <motion.div
            variants={containerFast}
            initial="hidden"
            whileInView="visible"
            viewport={VP_TIGHT}
            className="relative px-5 py-5 sm:px-6 sm:py-6 md:px-10 md:py-8"
          >
            {FEATURES.map((item, i) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  variants={itemVariant}
                  whileHover={{ x: 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="group relative"
                >
                  {/* scan line */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-[120px] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 py-4 sm:gap-5 sm:py-5">
                    <h3 className="text-[0.9rem] font-medium leading-snug text-neutral-300 transition group-hover:text-white md:text-[1.15rem]">
                      {item.title}
                    </h3>

                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 4 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:h-12 md:w-12"
                    >
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-neutral-300 group-hover:text-white transition" />
                    </motion.div>
                  </div>

                  {i !== FEATURES.length - 1 && (
                    <div className="border-b border-dashed border-white/10" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


