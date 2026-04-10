export type PresetFoodItem = {
  id: string;
  name: string;
  suggestedUnit: string;
  aliases?: string[];
  source: 'system' | 'custom';
};

export const presetFoodItems: PresetFoodItem[] = [
  { id: 'food-1', name: 'Banana', suggestedUnit: 'whole', aliases: ['bananas'], source: 'system' },
  { id: 'food-2', name: 'Apple', suggestedUnit: 'whole', aliases: ['apples'], source: 'system' },
  { id: 'food-3', name: 'Egg', suggestedUnit: 'whole', aliases: ['eggs'], source: 'system' },
  { id: 'food-4', name: 'Greek yogurt', suggestedUnit: 'cup', aliases: ['yogurt'], source: 'system' },
  { id: 'food-5', name: 'Chicken breast', suggestedUnit: 'oz', aliases: ['chicken'], source: 'system' },
  { id: 'food-6', name: 'White rice', suggestedUnit: 'cup', aliases: ['rice'], source: 'system' },
  { id: 'food-7', name: 'Rolled oats', suggestedUnit: 'cup', aliases: ['oatmeal', 'oats'], source: 'system' },
  { id: 'food-8', name: 'Peanut butter', suggestedUnit: 'tbsp', aliases: ['pb'], source: 'system' },
  { id: 'food-9', name: 'Blueberries', suggestedUnit: 'cup', aliases: ['blueberry'], source: 'system' },
  { id: 'food-10', name: 'Strawberries', suggestedUnit: 'cup', aliases: ['strawberry'], source: 'system' },
  { id: 'food-11', name: 'Bell pepper', suggestedUnit: 'cup', aliases: ['pepper', 'capsicum'], source: 'system' },
  { id: 'food-12', name: 'Black beans', suggestedUnit: 'cup', aliases: ['beans'], source: 'system' },
  { id: 'food-13', name: 'Olive oil', suggestedUnit: 'tbsp', aliases: ['oil'], source: 'system' },
  { id: 'food-14', name: 'Granola', suggestedUnit: 'cup', source: 'system' },
  { id: 'food-15', name: 'Broccoli', suggestedUnit: 'cup', source: 'system' },
  { id: 'food-16', name: 'Salmon', suggestedUnit: 'oz', source: 'system' },
];

export const commonUnits = [
  'whole',
  'piece',
  'serving',
  'cup',
  'tbsp',
  'tsp',
  'oz',
  'g',
  'lb',
  'slice',
] as const;
