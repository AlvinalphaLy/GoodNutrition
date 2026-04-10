import { parsePositiveAmount } from "./validation";

export const fieldPlaceholderColor = "#9ca3af";

const pluralUnits: Record<string, string> = {
  cup: "cups",
  piece: "pieces",
  serving: "servings",
  slice: "slices",
  lb: "lbs",
};

export function formatQuantityLabel(quantity: string, unit?: string) {
  const trimmedQuantity = quantity.trim();
  const trimmedUnit = unit?.trim() ?? "";

  if (!trimmedQuantity) {
    return trimmedUnit ? `Qty: ${trimmedUnit}` : "Qty: --";
  }

  if (!trimmedUnit) {
    return `Qty: ${trimmedQuantity}`;
  }

  return `Qty: ${trimmedQuantity} ${formatUnitForDisplay(trimmedUnit, trimmedQuantity)}`;
}

export function formatUnitForDisplay(unit: string, quantity: string) {
  const normalizedUnit = unit.trim().toLowerCase();
  if (!normalizedUnit) return "";

  const parsedQuantity = parsePositiveAmount(quantity);
  const shouldPluralize = parsedQuantity !== null && parsedQuantity > 1;

  if (!shouldPluralize) {
    return normalizedUnit;
  }

  return pluralUnits[normalizedUnit] ?? normalizedUnit;
}
