export function parsePositiveAmount(value: string): number | null {
  const normalized = value.trim();

  if (!normalized) return null;

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);

    if (denominator === 0) return null;

    const parsed = whole + numerator / denominator;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);

    if (denominator === 0) return null;

    const parsed = numerator / denominator;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function hasLetter(value: string) {
  return /[A-Za-z]/.test(value);
}

export function isValidNamedItem(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 && hasLetter(normalized);
}

export function isValidPositiveAmount(value: string) {
  return parsePositiveAmount(value) !== null;
}

export function isValidPositiveInteger(value: string) {
  return /^[1-9]\d*$/.test(value.trim());
}

export function getNamedItemError(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    return `${label} is required.`;
  }

  if (!hasLetter(normalized)) {
    return `${label} must include letters, not just numbers or symbols.`;
  }

  return '';
}

export function getAmountError(value: string, label = 'Quantity') {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  if (!isValidPositiveAmount(value)) {
    return `${label} must be a positive number, decimal, or fraction.`;
  }

  return '';
}

export function getPositiveIntegerError(value: string, label: string) {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  if (!isValidPositiveInteger(value)) {
    return `${label} must be a whole number greater than 0.`;
  }

  return '';
}
