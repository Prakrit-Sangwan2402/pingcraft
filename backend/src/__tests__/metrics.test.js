const { calculateP95, calculateAverage } = require('../services/metricsService');

describe('Telemetry Metrics & Percentiles Unit Tests', () => {
  describe('calculateP95 (Nearest-Rank Method)', () => {
    test('returns null for empty array or null input', () => {
      expect(calculateP95([])).toBeNull();
      expect(calculateP95(null)).toBeNull();
    });

    test('calculates correct p95 for a single observation', () => {
      expect(calculateP95([120])).toBe(120);
    });

    test('calculates accurate 95th percentile on sorted distribution', () => {
      // 20 values: 10, 20, 30, ... 200
      const values = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);
      // Math.ceil(0.95 * 20) = 19 -> index 18 -> value 190
      expect(calculateP95(values)).toBe(190);
    });

    test('handles unsorted input correctly', () => {
      const unsorted = [500, 100, 250, 50, 1000, 150, 75, 300, 200, 400];
      const result = calculateP95(unsorted);
      expect(result).toBe(1000);
    });

    test('rounds result to 2 decimal places', () => {
      expect(calculateP95([12.3456, 78.9101])).toBe(78.91);
    });
  });

  describe('calculateAverage', () => {
    test('returns null for empty input', () => {
      expect(calculateAverage([])).toBeNull();
      expect(calculateAverage(null)).toBeNull();
    });

    test('computes correct mean latency', () => {
      const latencies = [100, 200, 300];
      expect(calculateAverage(latencies)).toBe(200);
    });

    test('rounds accurately', () => {
      const latencies = [100, 100, 101];
      expect(calculateAverage(latencies)).toBe(100.33);
    });
  });
});
