import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import dashEmployer from "../../assets/dashboard-employer.jpg";
import dashEmployee from "../../assets/dashboard-employee.jpg";
import {
  containerVariant,
  containerFast,
  fadeUpVariant,
  fadeLeftVariant,
  fadeRightVariant,
  itemVariant,
  VP,
} from "../../lib/animations";

function FeatureBlock({
  eyebrow,
  title,
  subtitle,
  features,
  cta,
  image,
  reverse = false,
  id,
  bg,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
  image: string;
  reverse?: boolean;
  id: string;
  bg: string;
}) {
  const copyVariant = reverse ? fadeRightVariant : fadeLeftVariant;
  const imageVariant = reverse ? fadeLeftVariant : fadeRightVariant;

  return (
    <section id={id} style={{ backgroundColor: bg }} className="py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 md:px-10">
        <div
          className={[
            "flex flex-col gap-10 sm:gap-12 lg:flex-row lg:items-center lg:gap-16",
            reverse ? "lg:flex-row-reverse" : "",
          ].join(" ")}
        >
          {/* Copy column */}
          <motion.div
            variants={copyVariant}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="flex-1"
          >
            <motion.div variants={containerVariant}>
              <motion.span
                variants={itemVariant}
                className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-primary"
              >
                {eyebrow}
              </motion.span>

              <motion.h2
                variants={fadeUpVariant}
                className="mt-4 font-display text-[22px] sm:text-[28px] md:text-[36px] font-bold leading-[1.1] tracking-normal text-foreground"
              >
                {title}
              </motion.h2>

              <motion.p
                variants={itemVariant}
                className="mt-4 text-[15px] leading-relaxed text-muted-foreground"
              >
                {subtitle}
              </motion.p>

              <motion.ul variants={containerFast} className="mt-8 space-y-2.5">
                {features.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={itemVariant}
                    className="flex items-start gap-3 text-[14px] leading-relaxed text-foreground/75"
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {feature}
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div variants={itemVariant} className="mt-8">
                <Link
                  to="/app"
                  className="decrypt-hover-btn inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85 active:opacity-75"
                >
                  {cta}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6h7m0 0L6 2.5M9.5 6L6 9.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Image column */}
          <motion.div
            variants={imageVariant}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="flex-[1.4]"
          >
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center gap-1.5 border-b border-border bg-background/60 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-foreground/10" />
                <span className="h-2 w-2 rounded-full bg-foreground/10" />
                <span className="h-2 w-2 rounded-full bg-foreground/10" />
                <span className="ml-3 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  app.zalary.xyz {reverse ? "/ employee" : "/ employer"}
                </span>
              </div>

              <img
                src={image}
                alt={`${title} preview`}
                className="block w-full"
                width={1920}
                height={1080}
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function EmployerSection() {
  return (
    <FeatureBlock
      id="employers"
      bg="oklch(0.20 0 0)"
      eyebrow="For employers"
      title="Build payroll once. Run it repeatedly with privacy and control."
      subtitle="Payroll, schedules, runs, and funding flows — designed for finance teams that need confidentiality without losing operational rigor."
      features={[
        "Create reusable payroll",
        "Configure employees and allocations",
        "Schedule recurring payroll runs",
        "Generate funding quotes",
        "Fund and activate runs",
        "Track run statuses and operational state",
      ]}
      cta="Start as Employer"
      image={dashEmployer}
    />
  );
}

export function EmployeeSection() {
  return (
    <FeatureBlock
      id="employees"
      bg="oklch(0.175 0 0)"
      reverse
      eyebrow="For employees"
      title="Claim what is yours, without exposing what stays private."
      subtitle="A clear, wallet-native experience for finding claimable payroll runs and finalizing payouts through confidential flows."
      features={[
        "View claimable payroll runs",
        "Request confidential claims",
        "Sync pending claim states",
        "Finalize claim flows",
        "Continue into withdrawal",
        "Track statuses transparently",
      ]}
      cta="Continue as Employee"
      image={dashEmployee}
    />
  );
}



