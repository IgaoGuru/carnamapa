/**
 * Creates an HTML element for use as a custom map marker.
 * Displays event start time with an accent indicator for free (white) or paid (coral) status.
 * Styled with a festive carnival aesthetic - playful, vibrant, and readable on map tiles.
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
  const container = document.createElement('div');

  // Accent colors: soft white glow for free, warm coral for paid
  const accentColor = isFree ? '#FFFFFF' : '#FF6B6B';
  const accentGlow = isFree
    ? '0 0 4px rgba(255, 255, 255, 0.6)'
    : '0 0 4px rgba(255, 107, 107, 0.6)';

  // Base styles - festive gradient background with layered shadow for depth
  container.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 50%, #6A1FB0 100%);
    border-radius: 14px;
    padding: 5px 12px 5px 10px;
    cursor: pointer;
    box-shadow:
      0 2px 4px rgba(123, 44, 191, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    transform: translateZ(0);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    min-width: 52px;
    height: 26px;
    box-sizing: border-box;
  `;

  // Hover effect
  container.onmouseenter = () => {
    container.style.transform = 'translateZ(0) scale(1.05)';
    container.style.boxShadow = `
      0 3px 6px rgba(123, 44, 191, 0.4),
      0 6px 16px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `;
  };
  container.onmouseleave = () => {
    container.style.transform = 'translateZ(0)';
    container.style.boxShadow = `
      0 2px 4px rgba(123, 44, 191, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `;
  };

  // Accent pip - small circular indicator for free/paid status
  const accent = document.createElement('div');
  accent.style.cssText = `
    width: 8px;
    height: 8px;
    background-color: ${accentColor};
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: ${accentGlow};
  `;

  // Time text - bold and crisp
  const timeText = document.createElement('span');
  timeText.textContent = time;
  timeText.style.cssText = `
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  `;

  container.appendChild(accent);
  container.appendChild(timeText);

  return container;
}
