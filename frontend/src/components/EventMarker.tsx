/**
 * Creates an HTML element for use as a custom map marker.
 * Displays event start time with an accent color indicating free (white) or paid (red) status.
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

  // Accent color: white for free, red for paid
  const accentColor = isFree ? '#FFFFFF' : '#DC2626';

  // Base styles for the marker container
  container.style.cssText = `
    display: flex;
    align-items: center;
    background-color: #8A2BE2;
    border-radius: 9999px;
    padding: 4px 10px 4px 4px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    font-family: system-ui, -apple-system, sans-serif;
  `;

  // Accent stripe (left side indicator)
  const accent = document.createElement('div');
  accent.style.cssText = `
    width: 4px;
    height: 16px;
    background-color: ${accentColor};
    border-radius: 2px;
    margin-right: 6px;
  `;

  // Time text
  const timeText = document.createElement('span');
  timeText.textContent = time;
  timeText.style.cssText = `
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
  `;

  container.appendChild(accent);
  container.appendChild(timeText);

  return container;
}
