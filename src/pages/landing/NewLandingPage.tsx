import { Navbar } from "./components/zalary/Navbar";
import { Hero } from "./components/zalary/Hero";
import { ProductOverview } from "./components/zalary/ProductOverview";
import { HowItWorks } from "./components/zalary/HowItWorks";
import {
  EmployerSection,
  EmployeeSection,
} from "./components/zalary/UserSections";
import { Security } from "./components/zalary/Security";
import { Faq } from "./components/zalary/Faq";
import { FinalCta } from "./components/zalary/FinalCta";
import { Footer } from "./components/zalary/Footer";
import { PageLoader } from "./components/zalary/PageLoader";

export function NewLandingPage() {
  return (
    <>
      <PageLoader />

      <div className="zl-landing relative min-h-screen overflow-x-clip bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-[10%] top-[20%] h-[min(500px,70vw)] w-[min(500px,70vw)] rounded-full bg-primary/5 blur-[160px]" />
          <div className="absolute right-[5%] top-[60%] h-[min(400px,65vw)] w-[min(400px,65vw)] rounded-full bg-primary/3 blur-[140px]" />
        </div>

        <Navbar />

        <main>
          <Hero />
          <ProductOverview />
          <HowItWorks />
          <EmployerSection />
          <EmployeeSection />
          <Security />
          <Faq />
          <FinalCta />
        </main>

        <Footer />
      </div>
    </>
  );
}


