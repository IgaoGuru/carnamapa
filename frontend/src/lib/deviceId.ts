const STORAGE_KEY = 'carnamapa_device_id';

/**
 * Gets or creates a unique device identifier stored in localStorage.
 * Used to associate RSVPs with a specific device/browser.
 */
export function getDeviceId(): string {
  const existingId = localStorage.getItem(STORAGE_KEY);

  if (existingId) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}
