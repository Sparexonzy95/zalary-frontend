import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { containerVariant, fadeUpVariant, itemVariant, VP } from "../../lib/animations";

const STEPS = [
  {
    index: "01",
    title: "Deposit stablecoins",
    body: "Employers begin by depositing stablecoin value into the system, creating the entry point for confidential payroll operations.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032757/step1_-_deposit_hzn0oy.png",
  },
  {
    index: "02",
    title: "Convert into confidential value flow",
    body: "The deposited value moves into a confidential handling layer so payroll activity can remain private while still staying on-chain.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032756/step_2_-_confidential_s6tlvk.png",
  },
  {
    index: "03",
    title: "Create payroll and upload allocations",
    body: "Payroll is created, employee allocations are prepared, and salary amounts are structured before the payroll run is finalized.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032756/step_3_create_payrolls_liowmr.png",
  },
  {
    index: "04",
    title: "Fund and activate payroll",
    body: "The payroll is funded and activated so the private payout flow becomes ready for eligible employees.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032757/step_4_fund_and_activate_wlxoib.png",
  },
  {
    index: "05",
    title: "Employees request and finalize claims",
    body: "Employees discover claimable payroll runs, request their payout, and complete the confidential claim process.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032757/step_5_employee_request_xbwshc.png",
  },
  {
    index: "06",
    title: "Withdraw and complete payout",
    body: "After claim completion, value moves through the withdrawal path to complete the payout journey cleanly and securely.",
    image:
      "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777032757/step_6_bbnkul.png",
  },
];

const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const wheelBuffer = useRef(0);
  const lockedRef = useRef(false);

  const THRESHOLD = 80;

  const lock = useCallback(() => {
    if (isTouchDevice()) return;
    if (window.innerWidth < 1024 || window.innerHeight < 700) return;
    document.body.style.overflow = "hidden";
    lockedRef.current = true;
  }, []);

  const unlock = useCallback(() => {
    document.body.style.overflow = "";
    lockedRef.current = false;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.9) lock();
        else unlock();
      },
      { threshold: [0.9, 1] }
    );

    const el = document.getElementById("how");
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
      unlock();
    };
  }, [lock, unlock]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!lockedRef.current) return;

      e.preventDefault();
      wheelBuffer.current += e.deltaY;

      if (Math.abs(wheelBuffer.current) < THRESHOLD) return;

      const dir = wheelBuffer.current > 0 ? 1 : -1;
      wheelBuffer.current = 0;

      const next = indexRef.current + dir;

      if (next < 0) {
        unlock();
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
        return;
      }

      if (next >= STEPS.length) {
        unlock();
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
        return;
      }

      indexRef.current = next;
      setActiveIndex(next);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [unlock]);

  const handleMobileScroll = useCallback(() => {
    const scroller = mobileScrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.children) as HTMLElement[];
    if (cards.length === 0) return;

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    const closestIndex = cards.reduce((closest, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const closestCard = cards[closest];
      const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;

      return Math.abs(cardCenter - scrollerCenter) <
        Math.abs(closestCenter - scrollerCenter)
        ? index
        : closest;
    }, 0);

    setMobileIndex(closestIndex);
  }, []);

  const scrollToMobileStep = useCallback((index: number) => {
    const scroller = mobileScrollerRef.current;
    const card = scroller?.children[index] as HTMLElement | undefined;

    if (!scroller || !card) return;

    scroller.scrollTo({
      left: card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  const step = STEPS[activeIndex];

  return (
    <section
      id="how"
      className="relative flex flex-col overflow-hidden bg-[#09090B] py-12 sm:py-14 lg:h-[80vh] lg:min-h-[620px] lg:py-0"
    >
      {/* ========================
          HEADER — fixed, never scrolls
      ======================== */}
      <motion.div
        variants={containerVariant}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className="w-full flex-shrink-0 flex flex-col items-center text-center px-4 pb-5 lg:pt-9 lg:pb-3"
      >
        {/* Eyebrow */}
        <motion.span
          variants={itemVariant}
          className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-primary mb-3"
        >
          How it works
        </motion.span>

        {/* Title */}
        <motion.h2
          variants={fadeUpVariant}
          className="text-[20px] sm:text-[26px] md:text-[32px] font-bold leading-[1.1] tracking-normal text-white"
        >
          From deposit to payout,{" "}
          <span className="text-white/35">every step stays private.</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          variants={itemVariant}
          className="mt-2 md:mt-3 text-[13px] md:text-[14px] leading-[1.65] text-white/45 max-w-[480px]"
        >
          Stablecoin deposits, encrypted payroll runs, and wallet-native employee
          claims — six steps, zero on-chain exposure.
        </motion.p>

        {/* Step progress dots */}
        <div className="mt-3 hidden items-center gap-1.5 md:mt-4 lg:flex">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-5 bg-white/60" : "w-[6px] bg-white/20"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* ========================
          STAGE — fills remaining height
      ======================== */}
      <div className="lg:hidden">
        <div
          ref={mobileScrollerRef}
          onScroll={handleMobileScroll}
          className="snap-scroll-hidden flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3 sm:px-6 md:px-8"
          aria-label="How Zalary works steps"
        >
          {STEPS.map((item) => (
            <article
              key={item.index}
              className="flex w-[min(84vw,430px)] flex-none snap-center flex-col overflow-hidden rounded-md border border-white/10 bg-[#111113] shadow-2xl shadow-black/20"
            >
              <div className="relative h-[180px] overflow-hidden bg-[#0E0F12]/70 sm:h-[220px] md:h-[260px]">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-contain p-5 sm:p-6"
                  draggable={false}
                />
              </div>

              <div className="flex min-h-[250px] flex-col px-6 py-6 sm:min-h-[230px] sm:p-7">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Step {item.index}
                </div>

                <h3 className="text-xl font-semibold leading-tight tracking-normal text-white sm:text-2xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-[13px] leading-[1.7] text-white/70 sm:text-[14px]">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {STEPS.map((stepItem, i) => (
            <button
              key={stepItem.index}
              type="button"
              onClick={() => scrollToMobileStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === mobileIndex ? "w-6 bg-white/70" : "w-2 bg-white/25"
              }`}
              aria-label={`Show step ${stepItem.index}`}
              aria-current={i === mobileIndex ? "step" : undefined}
            />
          ))}
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 items-center justify-center px-8 pb-7 lg:flex">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex h-auto min-h-[360px] w-full max-w-[980px] flex-col overflow-hidden rounded-md border border-white/10 bg-[#111113] md:h-full md:min-h-0 md:flex-row"
        >
          {/* LEFT — text */}
          <div className="flex flex-shrink-0 flex-col justify-center px-6 py-7 sm:p-8 md:w-1/2 md:p-10">
            <div className="text-[10px] uppercase tracking-[0.35em] text-white/40 font-mono mb-3 md:mb-4">
              Step {step.index}
            </div>

            <h3 className="text-xl sm:text-2xl md:text-[28px] lg:text-[34px] font-semibold leading-tight tracking-normal text-white">
              {step.title}
            </h3>

            <p className="mt-3 md:mt-4 text-[13px] md:text-[14px] leading-[1.7] text-white/70 max-w-[42ch]">
              {step.body}
            </p>
          </div>

          {/* RIGHT — image, hidden on mobile */}
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#0E0F12]/60">
            <motion.img
              src={step.image}
              className="w-full h-full object-contain p-6 lg:p-8"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
              draggable={false}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}



