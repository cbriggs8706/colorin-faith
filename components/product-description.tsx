import type { ReactNode } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function renderLines(text: string) {
  const lines = text.split("\n");
  const output: ReactNode[] = [];

  lines.forEach((line, index) => {
    if (index > 0) {
      output.push(<br key={`br-${index}`} />);
    }
    output.push(<span key={`line-${index}`}>{renderInline(line)}</span>);
  });

  return output;
}

export function ProductDescription({ description }: { description: string }) {
  const blocks = description
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="rich-copy">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

        if (lines.length === 1 && lines[0].startsWith("## ")) {
          return (
            <h3 key={`block-${index}`} className="text-xl font-black text-[var(--brand-ink)]">
              {renderInline(lines[0].slice(3))}
            </h3>
          );
        }

        if (lines.length === 1 && lines[0].startsWith("# ")) {
          return (
            <h2
              key={`block-${index}`}
              className="section-title text-2xl font-extrabold text-[var(--brand-ink)]"
            >
              {renderInline(lines[0].slice(2))}
            </h2>
          );
        }

        const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line));

        if (bulletLines.length === lines.length && bulletLines.length > 0) {
          return (
            <ul key={`block-${index}`} className="space-y-2 pl-5 text-slate-700">
              {bulletLines.map((line, itemIndex) => (
                <li key={`item-${itemIndex}`}>{renderInline(line.replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${index}`} className="text-base leading-8 text-slate-700">
            {renderLines(block)}
          </p>
        );
      })}
    </div>
  );
}
