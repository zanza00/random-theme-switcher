export type SwitchModes = 'manual' | 'startup' | 'daily' | 'interval' | 'typing';

export function isSwitchMode(value: unknown): value is SwitchModes {
  return (
    value === 'manual' ||
    value === 'startup' ||
    value === 'daily' ||
    value === 'interval' ||
    value === 'typing'
  );
}
