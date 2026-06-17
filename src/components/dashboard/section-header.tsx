interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-normal text-white md:text-[2rem]">{title}</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
