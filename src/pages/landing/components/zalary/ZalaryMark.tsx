const LOGO_SRC = "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1776941645/logo_zalary2_mm8mlp.png";

export function ZalaryMark({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Zalary"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}



