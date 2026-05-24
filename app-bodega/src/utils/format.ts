export const formatNum = (
  value: number | string | null | undefined,
  decimals = 1
): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatPrecio = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined) return '$0';
  return `$${formatNum(value, 2)}`;
};

export const formatTon = (
  value: number | string | null | undefined
): string => {
  return `${formatNum(value, 1)} ton`;
};
