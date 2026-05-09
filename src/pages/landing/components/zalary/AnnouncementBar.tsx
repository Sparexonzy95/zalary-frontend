import { X } from "lucide-react";

type AnnouncementBarProps = {
  message: string;
  onClose: () => void;
};

export function AnnouncementBar({ message, onClose }: AnnouncementBarProps) {
  return (
    <div className="relative flex min-h-10 items-center justify-center bg-[#FE9E15] px-12 text-center text-xs font-semibold uppercase tracking-[0.24em] text-black">
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black/70 transition hover:bg-black/10 hover:text-black"
        aria-label="Close announcement"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
