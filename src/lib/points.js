// 25 points per ₹100 spent (i.e., sales × 0.25)
export function calculatePoints(salesAmount) {
  return Math.floor(salesAmount * 0.25);
}

// Worth = 1% of total sales
export function calculateWorth(totalSales) {
  return (totalSales * 0.01).toFixed(2);
}

// Internal accounts to exclude
export const EXCLUDED_CUSTOMERS = ["Triveni Mart"];
