import { Circle, Minus } from "lucide-react";

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={`brand-mark${compact ? " is-compact" : ""}`}>
      <span className="brand-glyph" aria-hidden="true">
        <Circle />
        <Minus />
      </span>
      <strong>OpenBioFigure</strong>
      {!compact && <span className="version">v0.2.1</span>}
    </div>
  );
}
