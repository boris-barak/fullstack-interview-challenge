import { cloneDate, getNow, toDateFromISOString, toISOStringFromDate } from "./date-utils";

describe('Date Utility Functions', () => {
  describe('toISOStringFromDate', () => {
    it('should format a Date object into ISO string (yyyy-MM-dd)', () => {
      const date = new Date('2025-01-01');
      const result = toISOStringFromDate(date);
      expect(result).toBe('2025-01-01');
    });
  });

  describe('toDateFromISOString', () => {
    it('should convert an ISO string to a Date object', () => {
      const isoString = '2025-01-01';
      const result = toDateFromISOString(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString().startsWith(isoString)).toBe(true);
    });
  });

  describe('getNow', () => {
    it('should return the current date and time as a Date object', () => {
      const now = getNow();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeCloseTo(Date.now(), -1); // Allowing small differences in milliseconds
    });
  });

  describe('cloneDate', () => {
    it('should return a new Date object identical to the input', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      const clonedDate = cloneDate(date);
      expect(clonedDate).toEqual(date);
      expect(clonedDate).not.toBe(date); // Ensure they are different instances
    });
  });
});
