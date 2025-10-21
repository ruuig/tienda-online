import { formatCurrency, formatDate, isValidEmail, generateId } from '@/src/shared/utils'

describe('Utils Functions', () => {
  describe('formatCurrency', () => {
    test('should format number as currency', () => {
      expect(formatCurrency(1234.56)).toBe('Q1234.56')
      expect(formatCurrency(0)).toBe('Q0.00')
      expect(formatCurrency(100)).toBe('Q100.00')
    })

    test('should handle decimal places', () => {
      expect(formatCurrency(123.456)).toBe('Q123.46')
    })
  })

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2023-10-15')
      expect(formatDate(date)).toBe('15/10/2023')
    })

    test('should handle different date formats', () => {
      const date = new Date('2023-12-31T23:59:59')
      expect(formatDate(date)).toBe('31/12/2023')
    })
  })

  describe('isValidEmail', () => {
    test('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co')).toBe(true)
    })

    test('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })
})
