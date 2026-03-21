type Step = {
  label: string;
  complete: boolean;
  active?: boolean;
};

export default function ProgressStepper({ steps }: { steps: Step[] }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div key={index} className={`stepper-item ${step.complete ? "done" : step.active ? "active" : ""}`}>
          <div className="stepper-dot">{step.complete ? "✓" : index + 1}</div>
          <div className="stepper-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
}