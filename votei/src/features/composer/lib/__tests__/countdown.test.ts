/** @jest-environment node */
import { formatCountdown } from '../countdown';

describe('formatCountdown', () => {
  it('pads seconds under a minute', () => {
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(59)).toBe('0:59');
  });

  it('formats minutes and seconds', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(1799)).toBe('29:59');
  });

  it('widens to hours instead of showing 119:59', () => {
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(7199)).toBe('1:59:59');
  });

  it('floors to zero rather than showing a negative clock', () => {
    expect(formatCountdown(-10)).toBe('0:00');
    expect(formatCountdown(0)).toBe('0:00');
  });
});
