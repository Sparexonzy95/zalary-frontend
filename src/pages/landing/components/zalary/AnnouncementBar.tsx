import { X } from "lucide-react";

type AnnouncementBarProps = {
  message: string;
  onClose: () => void;
};

export function AnnouncementBar({ message, onClose }: AnnouncementBarProps) {
  return (
    <div className="grid min-h-10 grid-cols-[2rem_minmax(0,1fr)_2rem] items-center bg-[#FE9E15] px-3 py-2 text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.16em] text-black sm:px-4 sm:text-xs sm:tracking-[0.24em]">
      <span className="col-start-2 min-w-0 px-2">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="col-start-3 flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-black/70 transition hover:bg-black/10 hover:text-black"
        aria-label="Close announcement"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
