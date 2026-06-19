export function formatPrice(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
