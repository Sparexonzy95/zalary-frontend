type Props = {
  title: string;
  description?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, description, right }: Props) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="h1">{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {right ? <div className="page-header-right">{right}</div> : null}
    </div>
  );
}