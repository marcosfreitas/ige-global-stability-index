/**
 * mm:ss, widening to h:mm:ss past an hour. Written as a pure function because
 * the naive `${minutes}:${seconds}` form renders a two-hour window as
 * "119:59", which reads as a bug to anyone looking at it.
 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
