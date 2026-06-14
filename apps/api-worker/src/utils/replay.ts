export function isTimestampValid(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - timestamp) < 300;
}
