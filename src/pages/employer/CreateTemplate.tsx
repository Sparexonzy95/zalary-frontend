import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../ui/Toast";
import TemplateForm from "../../features/templates/TemplateForm";
import { useCreateTemplate } from "../../hooks/useTemplates";
import { useWallet } from "../../lib/WalletContext";
import { env } from "../../lib/env";
import EmpFooter from "../../ui/EmpFooter";
import "../../styles/employer-pages.css";

export default function CreateTemplate() {
  const nav    = useNavigate();
  const toast  = useToast();
  const create = useCreateTemplate();
  const { wallet, connect } = useWallet();

  return (
    <div className="sh-page pg">
      <div className="pg-bg" />

      {/* ── hero ── */}
      <div className="pg-hero">
        <div className="pg-hero-l">
          <div className="pg-tag"><span className="pg-tag-dot" />New Template</div>
          <h1 className="pg-h1">
            Create Payroll<br /><span className="blue">Template</span>
          </h1>
          <p className="pg-lead">
            Define your payroll schedule and token. Employee allocations and
            encrypted funding are added after activation.
          </p>
        </div>
        <div className="pg-hero-r">
          {/* No wallet button here — navbar handles it */}
          <Link to="/employer" className="pg-back">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 16l-6-6 6-6"/>
            </svg>
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── no wallet prompt ── */}
      {!wallet && (
        <div className="panel" style={{ position: "relative", zIndex: 1 }}>
          <div className="panel-body" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".84rem", color: "#6b7591", lineHeight: 1.75, marginBottom: "1.5rem" }}>
              Connect your employer wallet using the button in the top-right navbar
              before creating a template. The wallet address is saved as the template owner.
            </div>
            <button className="pg-btn" onClick={async () => {
              try { await connect(); toast.push({ kind: "success", title: "Wallet connected" }); }
              catch (e: any) { toast.push({ kind: "error", title: "Connection failed", message: e?.message }); }
            }}>
              Connect Wallet
            </button>
          </div>
        </div>
      )}

      {/* ── form ── */}
      {wallet && (
        <TemplateForm
          chainId={env.CHAIN_DB_ID}
          submitting={create.isPending}
          onSubmit={async (payload) => {
            try {
              const created = await create.mutateAsync({
                ...(payload as any),
                employer_address: wallet.toLowerCase(),
              });
              toast.push({ kind: "success", title: "Template created" });
              nav(`/employer/templates/${created.id}`);
            } catch (e: any) {
              toast.push({
                kind: "error",
                title: "Could not create template",
                message: e?.message ?? "Please try again.",
              });
            }
          }}
        />
      )}

      <EmpFooter />
    </div>
  );
}