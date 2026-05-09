import React from "react";

type Toast = { id: number; kind: "success" | "error" | "info"; title: string; message?: string };
type ToastContextValue = { push: (toast: Omit<Toast, "id">) => void };
const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);
  function push(toast: Omit<Toast, "id">) {
    const id = Date.now() + Math.random();
    setItems((v) => [...v, { ...toast, id }]);
    window.setTimeout(() => setItems((v) => v.filter((x) => x.id !== id)), 4500);
  }
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">{items.map((t) => <div key={t.id} className={`toast ${t.kind}`}><b>{t.title}</b>{t.message && <span>{t.message}</span>}</div>)}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}


