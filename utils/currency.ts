// Prices are in Japanese yen. Admin pricing now allows decimal amounts (e.g. ¥116.50),
// so only show cents when they're actually non-zero - keeps whole-yen prices clean.
export function formatYen(amount: number): string {
  const hasFraction = Math.abs(amount % 1) > 0.001;
  return `¥${amount.toLocaleString("ja-JP", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
