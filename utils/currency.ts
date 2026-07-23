// Prices are in Japanese yen, which has no decimal subunit.
export function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}
