import { EventType } from '../types';

/** Timeline icons per spec §11 example. */
export const EVENT_EMOJI: Record<EventType, string> = {
  GOAL: '⚽',
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  SUBSTITUTION: '🔄',
};

export const EVENT_LABEL: Record<EventType, string> = {
  GOAL: 'Goal',
  YELLOW_CARD: 'Yellow Card',
  RED_CARD: 'Red Card',
  SUBSTITUTION: 'Substitution',
};
