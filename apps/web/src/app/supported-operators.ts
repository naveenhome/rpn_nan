/**
 * Operators offered as input chips. Grows per slice:
 * slice 2 adds `-` `*` `/`, slice 5 adds `^`, slices 6/7 add `%` `!`.
 */
export interface OperatorChip {
  symbol: string;
  label: string;
}

export const SUPPORTED_OPERATORS: readonly OperatorChip[] = [
  { symbol: '+', label: 'add' },
];
