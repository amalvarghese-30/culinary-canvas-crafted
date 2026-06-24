interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <section className="pt-36 pb-12 md:pt-44 md:pb-16 border-b border-border/50">
      <div className="container-luxe text-center">
        {eyebrow && <span className="kbd">{eyebrow}</span>}
        <h1 className="font-display text-5xl md:text-7xl mt-4 text-gradient-gold leading-[1.05]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
