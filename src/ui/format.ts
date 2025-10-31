// src/ui/format.ts
export const formatCurrencyAUD = (value: number): string => {
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    const v = Number.isFinite(value) ? value : 0;
    return `$${v.toFixed(2)}`;
  }
};

