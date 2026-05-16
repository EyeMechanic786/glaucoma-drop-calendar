import type { CapStyle } from '../types';

/** Colored cap visual for print/PDF (inline styles so html2canvas captures color). */
export function printCapHtml(
  capColor: string,
  capStyle: CapStyle,
  capColorSecondary?: string,
  isOral?: boolean,
): string {
  if (isOral || capStyle === 'oral') {
    return `<span class="print-cap print-cap--oral" aria-hidden="true"><span class="print-cap__pill">💊</span><span class="print-cap__tag">ORAL</span></span>`;
  }

  const style =
    capStyle === 'gradient' && capColorSecondary
      ? `background: linear-gradient(135deg, ${capColor} 50%, ${capColorSecondary} 50%);`
      : capStyle === 'striped'
        ? `background: repeating-linear-gradient(45deg, ${capColor}, ${capColor} 3px, ${capColorSecondary ?? '#374151'} 3px, ${capColorSecondary ?? '#374151'} 6px);`
        : `background: ${capColor};`;

  return `<span class="print-cap" style="${style}" aria-hidden="true"></span>`;
}

export function medAccentStyle(color: string): string {
  return `--med-accent: ${color}; border-left-color: ${color};`;
}
