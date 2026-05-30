import { assertNever } from './condition';
import type { ReturnCondition } from './types';

export type NoteTemplate = Record<ReturnCondition, string>;

const TEMPLATES: Record<string, NoteTemplate> = {
  Laptop: {
    Good: 'Laptop returned in good condition. No visible damage.',
    Damaged: 'Laptop returned with physical damage. Please inspect before reassignment.',
    'Missing accessories': 'Laptop returned without original accessories (charger/cable missing).',
  },
  Monitor: {
    Good: 'Monitor returned in good condition. Screen and cables intact.',
    Damaged: 'Monitor returned with visible damage (screen scratches or cracked panel).',
    'Missing accessories': 'Monitor returned without power cable or stand.',
  },
  Headset: {
    Good: 'Headset returned in good condition. No visible wear.',
    Damaged: 'Headset returned with damage (broken headband or non-functional mic/speakers).',
    'Missing accessories': 'Headset returned without USB dongle or original cable.',
  },
  Keyboard: {
    Good: 'Keyboard returned in good condition. All keys functional.',
    Damaged: 'Keyboard returned with damaged keys or casing.',
    'Missing accessories': 'Keyboard returned without USB cable or receiver dongle.',
  },
  Mouse: {
    Good: 'Mouse returned in good condition.',
    Damaged: 'Mouse returned with physical damage or non-functional buttons/scroll wheel.',
    'Missing accessories': 'Mouse returned without USB receiver or charging cable.',
  },
  'Docking Station': {
    Good: 'Docking station returned in good condition. All ports functional.',
    Damaged: 'Docking station returned with damage to ports or casing.',
    'Missing accessories': 'Docking station returned without power adapter.',
  },
};

const FALLBACK: NoteTemplate = {
  Good: 'Item returned in good condition.',
  Damaged: 'Item returned with damage. Please inspect before reassignment.',
  'Missing accessories': 'Item returned with missing accessories.',
};

export function suggestNote(type: string, assignedCondition: ReturnCondition): string {
  const template = TEMPLATES[type] ?? FALLBACK;
  switch (assignedCondition) {
    case 'Good':
    case 'Damaged':
    case 'Missing accessories':
      return template[assignedCondition];
    default:
      return assertNever(assignedCondition);
  }
}
