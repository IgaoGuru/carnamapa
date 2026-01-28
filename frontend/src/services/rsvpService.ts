import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

/**
 * Gets all event IDs that the current device has RSVP'd to.
 */
export async function getUserRsvps(): Promise<string[]> {
  const deviceId = getDeviceId();

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('event_id')
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error fetching RSVPs:', error);
      throw error;
    }

    return data?.map((row) => row.event_id) ?? [];
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    throw error;
  }
}

/**
 * Creates an RSVP for the current device and specified event.
 */
export async function createRsvp(eventId: string): Promise<void> {
  const deviceId = getDeviceId();

  try {
    const { error } = await supabase.from('rsvps').insert({
      device_id: deviceId,
      event_id: eventId,
    });

    if (error) {
      console.error('Error creating RSVP:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating RSVP:', error);
    throw error;
  }
}

/**
 * Deletes an RSVP for the current device and specified event.
 */
export async function deleteRsvp(eventId: string): Promise<void> {
  const deviceId = getDeviceId();

  try {
    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('device_id', deviceId)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error deleting RSVP:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    throw error;
  }
}
