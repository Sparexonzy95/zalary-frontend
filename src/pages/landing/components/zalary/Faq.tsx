import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const CATEGORIES = ["General", "Payment", "Security", "Confidential"] as const;
type Category = (typeof CATEGORIES)[number];

const FAQS: { category: Category; q: string; a: string }[] = [
  {
    category: "General",
    q: "What is Zalary and who is it built for?",
    a: "Zalary is a confidential onchain payroll protocol designed for modern teams, DAOs, and globally distributed organizations. It allows operators to manage payroll in a structured and verifiable way while keeping sensitive compensation data private.",
  },
  {
    category: "General",
    q: "What makes Zalary different from traditional payroll systems?",
    a: "Traditional payroll systems rely on centralized infrastructure and often expose sensitive data across multiple systems. Zalary treats payroll as a protocol, enabling private compensation handling with verifiable execution.",
  },
  {
    category: "General",
    q: "How does Zalary fit into an existing workflow?",
    a: "Zalary integrates smoothly into existing operational flows without replacing your entire financial stack.",
  },
  {
    category: "General",
    q: "Is Zalary only for crypto-native teams?",
    a: "No. It works for any organization that needs global payroll coordination with privacy guarantees.",
  },

  {
    category: "Payment",
    q: "What assets can be used for payroll?",
    a: "Zalary supports stable assets like USDC for predictable payouts.",
  },
  {
    category: "Payment",
    q: "How are payroll funds managed?",
    a: "Funds are stored in a structured payroll vault and distributed using predefined logic.",
  },
  {
    category: "Payment",
    q: "Can employees withdraw funds in different ways?",
    a: "Yes, depending on integrations, employees can withdraw or convert balances flexibly.",
  },
  {
    category: "Payment",
    q: "Are payouts instant?",
    a: "They depend on network speed but are optimized for near-instant finalization.",
  },

  {
    category: "Security",
    q: "How secure is Zalary?",
    a: "It uses audited smart contracts and controlled execution flows.",
  },
  {
    category: "Security",
    q: "Is the payroll process fully onchain?",
    a: "Yes, execution is onchain while sensitive data remains protected.",
  },
  {
    category: "Security",
    q: "What prevents errors in payroll execution?",
    a: "Structured payroll and deterministic workflows reduce errors.",
  },
  {
    category: "Security",
    q: "Can transactions be verified without exposing data?",
    a: "Yes, verification is possible without exposing sensitive details.",
  },

  {
    category: "Confidential",
    q: "Are salaries visible onchain?",
    a: "No, salary data is never publicly visible.",
  },
  {
    category: "Confidential",
    q: "How does Zalary maintain privacy while staying verifiable?",
    a: "Execution is onchain but data exposure is abstracted through confidential layers.",
  },
  {
    category: "Confidential",
    q: "Who can see payroll information?",
    a: "Only authorized participants can access payroll data.",
  },
  {
    category: "Confidential",
    q: "Why is confidential payroll important?",
    a: "It prevents unnecessary exposure of sensitive compensation data.",
  },
];

export function Faq() {
  const [activeCategory, setActiveCategory] = useState<Category>("General");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filtered = FAQS.filter((f) => f.category === activeCategory);

  /* ────────────────
     MAGNETIC SYSTEM
  ──────────────── */
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 120, damping: 20 });
  const springY = useSpring(y, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;

    x.set(relX * 0.05);
    y.set(relY * 0.05);
  };

  return (
    <section id="faq" className="relative overflow-hidden bg-[#1c1c1c] py-16 md:py-24">
      {/* dark ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-10%] h-[60vh] w-[45vw] bg-black/50 blur-[160px]" />
        <div className="absolute bottom-0 left-[-10%] h-[40vh] w-[35vw] bg-black/40 blur-[140px]" />
      </div>

      <motion.div
        className="mx-auto max-w-[820px] px-4 sm:px-6"
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, scale: 0.97, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* HEADER */}
        <div className="mb-10 text-center md:mb-12">
          <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            Frequently Asked Questions
          </h2>
        </div>

        {/* CATEGORY FILTER */}
        <div className="mb-8 flex justify-start overflow-x-auto pb-2 sm:mb-10 sm:justify-center">
          <div className="flex min-w-max rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenQuestion(null);
                  }}
                  className="relative whitespace-nowrap px-3 py-1.5 text-[10px] uppercase tracking-widest sm:px-4 sm:text-[11px]"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-white/10 border border-white/15"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <span
                    className={`relative z-10 transition ${isActive ? "text-white" : "text-white/45"
                      }`}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ LIST */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filtered.map((faq) => {
                const isOpen = openQuestion === faq.q;

                const rotateX = useTransform(y, [-50, 50], [6, -6]);
                const rotateY = useTransform(x, [-50, 50], [-6, 6]);

                return (
                  <motion.div
                    key={faq.q}
                    layout
                    style={{
                      rotateX,
                      rotateY,
                      transformPerspective: 900,
                    }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                    className="
    relative
    rounded-[3px]
    border border-white/10
    bg-white/[0.03]
    overflow-hidden
  "
                  >
                    {/* QUESTION */}
                    <button
                      onClick={() =>
                        setOpenQuestion(isOpen ? null : faq.q)
                      }
                      className="w-full flex justify-between px-5 py-5 text-left"
                    >
                      <span className="pr-4 text-sm text-white/80 sm:text-base">{faq.q}</span>
                      <span className="flex-shrink-0 text-white/40">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {/* ANSWER */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 22,
                          }}
                          className="px-5 pb-5 text-sm text-white/60 leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* magnetic layer */}
                    <motion.div
                      style={{ x: springX, y: springY }}
                      className="absolute inset-0 pointer-events-none"
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}



