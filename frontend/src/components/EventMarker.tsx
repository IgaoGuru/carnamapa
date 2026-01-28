/**
 * Creates an HTML element for use as a custom map marker.
 * Displays event start time. Pastel green outline for free, red outline for paid.
 */

interface EventMarkerOptions {
  time: string;   // HH:MM format
  isFree: boolean;
}

/**
 * Creates a custom marker element for map display.
 * Returns an HTMLElement suitable for MapTiler's Marker API.
 */
export function createEventMarkerElement({ time, isFree }: EventMarkerOptions): HTMLElement {
  // Outer container - MapTiler controls transform on this, so we don't touch it
  const container = document.createElement('div');

  // Subtle shadow for depth
  const boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)';
  const hoverBoxShadow = '0 3px 6px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(0, 0, 0, 0.15)';

  // Outline color: pastel green for free, red for paid (outline is outside the box)
  const outlineColor = isFree ? '#90EE90' : '#FF0000';

  // Inner box - apply all visual styles and hover effects here
  const inner = document.createElement('div');
  inner.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    cursor: pointer;
    box-shadow: ${boxShadow};
    outline: 2px solid ${outlineColor};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    transform: scale(1);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    box-sizing: border-box;
  `;

  // Hover effect on inner element
  inner.onmouseenter = () => {
    inner.style.transform = 'scale(1.05)';
    inner.style.boxShadow = hoverBoxShadow;
  };
  inner.onmouseleave = () => {
    inner.style.transform = 'scale(1)';
    inner.style.boxShadow = boxShadow;
  };

  // Time text - bold and dark for contrast on white background
  const timeText = document.createElement('span');
  timeText.textContent = time;
  timeText.style.cssText = `
    color: #1A1A1A;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.01em;
  `;

  inner.appendChild(timeText);
  container.appendChild(inner);

  return container;
}
