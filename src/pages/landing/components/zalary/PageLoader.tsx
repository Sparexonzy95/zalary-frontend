import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_SVG =
  "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1777101955/svg_zalary_damrtk.svg";

/*
  Clean Minimal Loader
  - No gradients
  - No drop shadows
  - Flat dark gray background
  - Flat monochromatic #FE9E15 accents
*/

export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;
    let finished = false;

    const timer = setInterval(() => {
      if (finished) return;

      if (value < 72) value += Math.random() * 4;
      else if (value < 90) value += Math.random() * 1;

      setProgress(Math.min(value, 90));
    }, 120);

    const complete = () => {
      finished = true;
      clearInterval(timer);

      let end = value;

      const finishTimer = setInterval(() => {
        end += 3.5;
        setProgress(Math.min(end, 100));

        if (end >= 100) {
          clearInterval(finishTimer);

          setTimeout(() => {
            setVisible(false);
          }, 300);
        }
      }, 24);
    };

    if (document.readyState === "complete") {
      setTimeout(complete, 450);
    } else {
      window.addEventListener("load", complete);
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener("load", complete);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "#1f1f1f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "0 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            {/* Logo */}
            <motion.img
              src={LOGO_SVG}
              alt="Logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                width: "100%",
                maxWidth: "100vw",
                maxHeight: "88px",
                objectFit: "contain",
              }}
            />

            {/* Loader Bar */}
            <div
              style={{
                width: "min(260px,72vw)",
                height: "4px",
                background: "#353535",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: "#FE9E15",
                  borderRadius: "999px",
                }}
              />
            </div>

            {/* Percent */}
            <span
              style={{
                fontSize: 11,
                letterSpacing: "2px",
                fontWeight: 600,
                color: "#FE9E15",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {Math.floor(progress)}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



