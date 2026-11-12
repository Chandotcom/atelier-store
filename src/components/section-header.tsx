import Link from "next/link";

type Props = {
  title: string;
  eyebrow?: string;
  link?: { label: string; href: string };
  /** Heading level; defaults to h2. */
  as?: "h2" | "h3";
};

/** Section title row: eyebrow + serif headline on the left, CTA link on the right. */
export function SectionHeader({ title, eyebrow, link, as: Heading = "h2" }: Props) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
      <div>
        {eyebrow && <p className="text-eyebrow text-muted mb-3">{eyebrow}</p>}
        <Heading className="heading-headline">{title}</Heading>
      </div>
      {link && (
        <Link href={link.href} className="link-cta shrink-0">
          {link.label}
        </Link>
      )}
    </div>
  );
}
