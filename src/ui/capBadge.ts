import type { CapStyle } from '../types';

export function capBadgeHtml(
  capColor: string,
  capStyle: CapStyle,
  capColorSecondary?: string,
  isOral?: boolean,
  small = false,
): string {
  const cls = small ? 'cap-badge cap-badge--sm' : 'cap-badge';
  if (isOral || capStyle === 'oral') {
    return `<span class="${cls} cap-badge--oral" aria-hidden="true" title="Oral tablet">
      <span class="cap-badge__pill">💊</span>
      <span class="cap-badge__oral-label">ORAL</span>
    </span>`;
  }

  const style =
    capStyle === 'gradient' && capColorSecondary
      ? `background: linear-gradient(135deg, ${capColor} 50%, ${capColorSecondary} 50%);`
      : capStyle === 'striped'
        ? `background: repeating-linear-gradient(45deg, ${capColor}, ${capColor} 4px, ${capColorSecondary ?? '#374151'} 4px, ${capColorSecondary ?? '#374151'} 8px);`
        : `background: ${capColor};`;

  return `<span class="${cls}" style="${style}" aria-hidden="true"></span>`;
}
