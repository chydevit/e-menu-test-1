const DEFAULT_USD_TO_KHR = 4100;

function numberFromEnv(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export const USD_TO_KHR = numberFromEnv(import.meta.env.VITE_USD_TO_KHR, DEFAULT_USD_TO_KHR);

export function formatUSD(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

export function khrFromUSD(usdAmount) {
  const num = Number(usdAmount);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * USD_TO_KHR);
}

export function formatKHRFromUSD(usdAmount) {
  const khr = khrFromUSD(usdAmount);
  return `${khr.toLocaleString("en-US")}៛`;
}

