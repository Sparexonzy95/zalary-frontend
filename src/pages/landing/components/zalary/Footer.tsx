import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

/* Official-style X icon */
const XLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M18.244 2H21.5l-7.6 8.66L22 22h-6.5l-5.1-6.7L4.5 22H1.25l8.1-9.2L2 2h6.7l4.6 6.1L18.244 2Zm-1.13 18h1.8L6.3 3.9H4.4L17.114 20Z" />
  </svg>
);

const FacebookLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const InstagramLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
  </svg>
);

const LinkedinLogo = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.35 8h4.3v15H.35V8Zm7.65 0h4.12v2.05h.06c.57-1.08 1.96-2.22 4.04-2.22 4.33 0 5.13 2.85 5.13 6.56V23h-4.3v-7.62c0-1.82-.03-4.16-2.54-4.16-2.54 0-2.93 1.98-2.93 4.03V23H8V8Z" />
  </svg>
);

const footerLinks = [
  {
    title: "Product",
    items: [
      { label: "How It Works", href: "#how" },
      { label: "For Employers", href: "#employers" },
      { label: "For Employees", href: "#employees" },
      { label: "Security", href: "#security" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms of Use", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Legal", href: "#" },
    ],
  },
];

const socials = [
  {
    icon: <FacebookLogo size={18} />,
    label: "Facebook",
    href: "#",
  },
  {
    icon: <XLogo size={18} />,
    label: "X",
    href: "https://x.com",
  },
  {
    icon: <InstagramLogo size={18} />,
    label: "Instagram",
    href: "#",
  },
  {
    icon: <LinkedinLogo size={18} />,
    label: "LinkedIn",
    href: "#",
  },
];

export function Footer() {
  const ref = useRef<HTMLElement | null>(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden border-t border-white/10 bg-black text-white"
    >
      {/* Background Logo */}
      <div className="absolute inset-0 -z-30">
        <img
          src="https://res.cloudinary.com/dhjmedwbx/image/upload/v1777137005/ZALARY_LOGO_SVG_6_jr0b0u.svg"
          alt="Background"
          className="h-full w-full object-contain opacity-[0.05] blur-sm scale-125"
        />
      </div>

      {/* Glow Overlay */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,_rgba(255,170,0,0.08),_transparent_55%)]" />

      {/* Grain Texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-[1440px] px-5 py-12 sm:px-6 md:px-10 md:py-16 lg:px-14"
      >
        {/* Top CTA */}
        <div className="mb-14 overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.06] shadow-2xl backdrop-blur-3xl">
          <div className="relative grid items-center gap-8 p-6 sm:p-8 md:p-12 lg:grid-cols-[1fr_auto] lg:gap-10">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  Talk to our team
                </p>
              </div>

              <Mail
                size={240}
                className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-white/5 pointer-events-none lg:block"
              />

              <h2 className="text-2xl font-semibold leading-tight tracking-normal sm:text-3xl md:text-5xl lg:text-6xl">
                Let’s connect and build
                <br />
                <span className="block text-white/60">
                  the right payroll solution.
                </span>
              </h2>

              <p className="mt-5 max-w-[620px] text-sm leading-relaxed text-white/55 md:text-base">
                Speak with our team about confidential payroll, seamless employee
                payouts, and enterprise payment operations. We’re here to help
                you launch faster and scale smarter.
              </p>
            </div>

            <Link
              to="/app"
              aria-label="Launch Zalary app"
              className="decrypt-hover-btn group flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-lime-300 text-black transition-all duration-300 hover:scale-105 sm:h-20 sm:w-20"
            >
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Community CTA Card */}
        <div className="mb-14 overflow-hidden rounded-[20px] border border-white/30 bg-white/80 text-black shadow-2xl backdrop-blur-3xl">
          <div className="relative grid items-center gap-8 p-6 sm:p-8 md:p-12 lg:grid-cols-[1fr_auto] lg:gap-10">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-black/50">
                  Join our community
                </p>
              </div>

              <XLogo
                size={240}
                className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-black/5 pointer-events-none lg:block"
              />

              <h2 className="text-2xl font-semibold leading-tight tracking-normal sm:text-3xl md:text-5xl lg:text-6xl">
                Follow the conversation
                <span className="block text-black/60">on X.</span>
              </h2>

              <p className="mt-5 max-w-[620px] text-sm leading-relaxed text-black/60 md:text-base">
                Stay updated with product releases, payroll insights, team
                updates, and the future of confidential payroll for modern
                businesses.
              </p>
            </div>

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="decrypt-hover-btn group flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-neutral-200 text-black transition-all duration-300 hover:scale-105 sm:h-20 sm:w-20"
              aria-label="Visit Zalary on X"
            >
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid gap-12 border-y border-white/10 py-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <h3 className="max-w-[320px] text-2xl font-semibold leading-tight tracking-normal md:text-4xl">
              Payroll infrastructure for high-performance companies.
            </h3>

            <Link
              to="/app"
              className="decrypt-hover-btn mt-8 inline-flex items-center gap-2 rounded-full bg-[#FE9E15] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#FE9E15]/90"
            >
              Launch App
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-10 md:grid-cols-4">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-white/35">
                  {group.title}
                </h4>

                <ul className="space-y-3 text-sm text-white/65">
                  {group.items.map((item) => (
                    <li key={`${group.title}-${item.label}`}>
                      <a
                        href={item.href}
                        className="transition hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}

                  {group.title === "Product" && (
                    <li>
                      <Link to="/app" className="transition hover:text-white">
                        Launch App
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col gap-8 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  social.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-all duration-300 hover:border-white/20 hover:text-white"
                aria-label={social.label}
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {social.icon}
                </span>
              </a>
            ))}
          </div>

          <div className="text-left md:text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
              © {new Date().getFullYear()} Zalary. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Full-width wordmark at the very bottom */}
      <div className="w-full overflow-hidden">
        <img
          src="https://res.cloudinary.com/dhjmedwbx/image/upload/v1777145846/ZALARY_LOGO_SVG_3_half_cdjkqt.svg"
          alt="Zalary"
          className="mx-auto block w-[90vw] select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </footer>
  );
}



