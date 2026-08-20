// Fixed delivery fee of 50 AED per emirate.
export const EMIRATE_DELIVERY_FEE = 50;

export const EMIRATES = [
  "أبوظبي",
  "دبي",
  "الشارقة",
  "عجمان",
  "أم القيوين",
  "رأس الخيمة",
  "الفجيرة",
] as const;

export type Emirate = (typeof EMIRATES)[number];
