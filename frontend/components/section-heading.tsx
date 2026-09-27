import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <Reveal
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span className="font-mono text-accent">{index}</span>
        <span aria-hidden className="h-px w-6 bg-border" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-balance mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      {description && (
        <p className="text-balance mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </Reveal>
  );
}
