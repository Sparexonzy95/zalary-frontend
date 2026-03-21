import React from "react";

type ToastItem = { id: string; title: string; message?: string; kind: "success" | "error" | "info" };

const ToastContext = React.createContext<{
  push: (t: Omit<ToastItem, "id">) => void;
} | null>(null);

let externalPush: ((t: Omit<ToastItem, "id">) => void) | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, ...t };
    setItems((prev) => [item, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  React.useEffect(() => {
    externalPush = push;
    return () => {
      externalPush = null;
    };
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-viewport">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div className="toast-title">{t.title}</div>
            {t.message ? <div className="toast-msg">{t.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  return null;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      push: (t: Omit<ToastItem, "id">) => {
        if (externalPush) externalPush(t);
      },
    };
  }
  return ctx;
}