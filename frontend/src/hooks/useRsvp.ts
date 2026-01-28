import { useState, useCallback } from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { useRsvpContext } from '../contexts/RsvpContext';

interface UseRsvpReturn {
  isGoing: boolean;
  isLoading: boolean;
  toggleRsvp: () => Promise<void>;
  canRsvp: boolean;
}

export function useRsvp(eventId: string, eventDate: string): UseRsvpReturn {
  const { rsvpEventIds, isLoading: contextLoading, addRsvp, removeRsvp } = useRsvpContext();
  const [isToggling, setIsToggling] = useState(false);

  const isGoing = rsvpEventIds.has(eventId);

  const canRsvp = !isBefore(startOfDay(new Date(eventDate)), startOfDay(new Date()));

  const toggleRsvp = useCallback(async () => {
    setIsToggling(true);
    try {
      if (isGoing) {
        await removeRsvp(eventId);
      } else {
        await addRsvp(eventId);
      }
    } catch (error) {
      console.error('Failed to toggle RSVP:', error);
    } finally {
      setIsToggling(false);
    }
  }, [isGoing, eventId, addRsvp, removeRsvp]);

  return {
    isGoing,
    isLoading: contextLoading || isToggling,
    toggleRsvp,
    canRsvp,
  };
}
