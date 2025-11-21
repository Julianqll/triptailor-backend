import { ExternalApiAdapter, ExternalActivity } from '../../src/common/adapters/external-api.adapter';

describe('Contract Testing - External API Adapters', () => {
  describe('Provider A Contract', () => {
    it('should transform Provider A format correctly', () => {
      const providerAData = {
        external_id: 'act-123',
        title: 'Test Activity',
        desc: 'Test Description',
        category: 'food',
        cost: 50,
        address: '123 Test St',
        duration_minutes: 120,
        is_available: true,
      };

      const result = ExternalApiAdapter.transformActivity(providerAData, 'provider-a');

      expect(result).toEqual({
        id: 'act-123',
        name: 'Test Activity',
        description: 'Test Description',
        type: 'GASTRONOMY',
        price: 50,
        location: '123 Test St',
        duration: 120,
        available: true,
      });
    });

    it('should validate Provider A contract', () => {
      const validData = {
        external_id: 'act-123',
        title: 'Test',
        cost: 50,
        is_available: true,
      };

      expect(ExternalApiAdapter.validateActivityContract(validData)).toBe(true);
    });

    it('should reject invalid Provider A contract', () => {
      const invalidData = {
        external_id: 'act-123',
        // Missing required fields
      };

      expect(ExternalApiAdapter.validateActivityContract(invalidData)).toBe(false);
    });
  });

  describe('Provider B Contract', () => {
    it('should transform Provider B format correctly', () => {
      const providerBData = {
        id: 'act-456',
        name: 'Culture Tour',
        description: 'Cultural experience',
        type: 'museum',
        pricing: {
          amount: 75,
        },
        location: {
          address: '456 Culture Ave',
        },
        duration: 180,
        availability: {
          status: 'available',
        },
      };

      const result = ExternalApiAdapter.transformActivity(providerBData, 'provider-b');

      expect(result).toEqual({
        id: 'act-456',
        name: 'Culture Tour',
        description: 'Cultural experience',
        type: 'CULTURE',
        price: 75,
        location: '456 Culture Ave',
        duration: 180,
        available: true,
      });
    });

    it('should validate Provider B contract', () => {
      const validData = {
        id: 'act-456',
        name: 'Test',
        pricing: { amount: 75 },
        availability: { status: 'available' },
      };

      expect(ExternalApiAdapter.validateActivityContract(validData)).toBe(true);
    });
  });

  describe('Activity Type Mapping', () => {
    it('should map all activity types correctly', () => {
      const testCases = [
        { input: 'food', expected: 'GASTRONOMY' },
        { input: 'restaurant', expected: 'GASTRONOMY' },
        { input: 'adventure', expected: 'ADVENTURE' },
        { input: 'sports', expected: 'ADVENTURE' },
        { input: 'culture', expected: 'CULTURE' },
        { input: 'museum', expected: 'CULTURE' },
        { input: 'nightlife', expected: 'NIGHTLIFE' },
        { input: 'bar', expected: 'NIGHTLIFE' },
        { input: 'spa', expected: 'RELAX' },
        { input: 'wellness', expected: 'RELAX' },
        { input: 'unknown', expected: 'CULTURE' }, // Default
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ExternalApiAdapter.transformActivity(
          { category: input, external_id: '1', title: 'Test', cost: 0, address: '', duration_minutes: 0, is_available: true },
          'provider-a',
        );
        expect(result.type).toBe(expected);
      });
    });
  });

  describe('Contract Violation Detection', () => {
    it('should detect missing required fields', () => {
      const incompleteData = {
        external_id: 'act-123',
        // Missing: title, cost, is_available
      };

      expect(ExternalApiAdapter.validateActivityContract(incompleteData)).toBe(false);
    });

    it('should detect null values in required fields', () => {
      const nullData = {
        external_id: null,
        title: 'Test',
        cost: 50,
        is_available: true,
      };

      // El validador ahora verifica que los valores no sean null
      expect(ExternalApiAdapter.validateActivityContract(nullData)).toBe(false);
    });
  });
});

