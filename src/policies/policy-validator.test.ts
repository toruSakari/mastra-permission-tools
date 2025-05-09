import { describe, it, expect, beforeEach } from "vitest";
import {
	validateSecurityPolicy,
	mergeSecurityPolicies,
	calculatePolicyDiff,
	normalizeSecurityPolicy,
} from "./policy-validator";
import { SecurityLevel } from "../types/security";
import type { SecurityPolicy } from "../types/security";

describe("policy-validator", () => {
	let validPolicy: SecurityPolicy;

	beforeEach(() => {
		validPolicy = {
			tools: {
				TestTool: {
					securityLevel: 'medium',
					category: "test",
				},
			},
			categories: {
				test: { securityLevel: 'low' },
			},
			defaults: {
				['none']: { requirePermission: false },
				['low']: { requirePermission: true, expiry: "1h" },
				['medium']: { requirePermission: true, expiry: "30m" },
				['high']: { requirePermission: true, expiry: "once" },
				['critical']: { requirePermission: true, expiry: "once" },
			},
		};
	});

	describe("validateSecurityPolicy", () => {
		it("should validate a correct policy", () => {
			const result = validateSecurityPolicy(validPolicy);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect missing required fields", () => {
			const invalidPolicy = {} as SecurityPolicy;
			const result = validateSecurityPolicy(invalidPolicy);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"Security policy must have a tools property",
			);
			expect(result.errors).toContain(
				"Security policy must have a categories property",
			);
			expect(result.errors).toContain(
				"Security policy must have a defaults property",
			);
		});

		it("should detect invalid security levels in tools", () => {
			const invalidPolicy: SecurityPolicy = {
				...validPolicy,
				tools: {
					BadTool: {
						securityLevel: "invalid" as SecurityLevel,
					},
				},
			};

			const result = validateSecurityPolicy(invalidPolicy);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Invalid security level for tool "BadTool": invalid',
			);
		});

		it("should warn about undefined categories", () => {
			const policyWithUndefinedCategory: SecurityPolicy = {
				...validPolicy,
				tools: {
					TestTool: {
						category: "nonexistent",
					},
				},
			};

			const result = validateSecurityPolicy(policyWithUndefinedCategory);
			expect(result.warnings).toContain(
				'Tool "TestTool" references undefined category: nonexistent',
			);
		});

		it("should validate expiry formats", () => {
			const invalidExpiryPolicy: SecurityPolicy = {
				...validPolicy,
				defaults: {
					...validPolicy.defaults,
					['low']: { requirePermission: true, expiry: "invalid" },
				},
			};

			const result = validateSecurityPolicy(invalidExpiryPolicy);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"Invalid expiry value for level low: invalid",
			);
		});

		it("should validate parameter rules", () => {
			const policyWithInvalidRules: SecurityPolicy = {
				...validPolicy,
				parameterRules: {
					TestTool: "not-an-array" as any,
				},
			};

			const result = validateSecurityPolicy(policyWithInvalidRules);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Parameter rules for tool "TestTool" must be an array',
			);
		});
	});

	describe("mergeSecurityPolicies", () => {
		it("should merge two policies correctly", () => {
			const policy1: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'low' } },
				categories: { cat1: { securityLevel: 'low' } },
				defaults: {
					...validPolicy.defaults,
					['low']: { requirePermission: true },
				},
			};

			const policy2: SecurityPolicy = {
				tools: { Tool2: { securityLevel: 'high' } },
				categories: { cat2: { securityLevel: 'high' } },
				defaults: {
					...validPolicy.defaults,
					['high']: { requirePermission: true },
				},
			};

			const merged = mergeSecurityPolicies(policy1, policy2);

			expect(merged.tools.Tool1).toBeDefined();
			expect(merged.tools.Tool2).toBeDefined();
			expect(merged.categories!.cat1).toBeDefined();
			expect(merged.categories!.cat2).toBeDefined();
			expect(merged.defaults['low']).toBeDefined();
			expect(merged.defaults['high']).toBeDefined();
		});

		it("should override values from first policy with second", () => {
			const policy1: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'low' } },
				categories: {},
				defaults: {},
			};

			const policy2: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'high' } },
				categories: {},
				defaults: {},
			};

			const merged = mergeSecurityPolicies(policy1, policy2);
			expect(merged.tools.Tool1.securityLevel).toBe('high');
		});
	});

	describe("calculatePolicyDiff", () => {
		it("should detect added tools", () => {
			const original: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'low' } },
				categories: {},
				defaults: {},
			};

			const current: SecurityPolicy = {
				tools: {
					Tool1: { securityLevel: 'low' },
					Tool2: { securityLevel: 'high' },
				},
				categories: {},
				defaults: {},
			};

			const diff = calculatePolicyDiff(original, current);
			expect(diff.added.tools).toHaveProperty("Tool2");
			expect(diff.removed.tools).toEqual({});
			expect(diff.modified.tools).toEqual({});
		});

		it("should detect removed tools", () => {
			const original: SecurityPolicy = {
				tools: {
					Tool1: { securityLevel: 'low' },
					Tool2: { securityLevel: 'high' },
				},
				categories: {},
				defaults: {},
			};

			const current: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'low' } },
				categories: {},
				defaults: {},
			};

			const diff = calculatePolicyDiff(original, current);
			expect(diff.removed.tools).toHaveProperty("Tool2");
			expect(diff.added.tools).toEqual({});
			expect(diff.modified.tools).toEqual({});
		});

		it("should detect modified tools", () => {
			const original: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'low' } },
				categories: {},
				defaults: {},
			};

			const current: SecurityPolicy = {
				tools: { Tool1: { securityLevel: 'high' } },
				categories: {},
				defaults: {},
			};

			const diff = calculatePolicyDiff(original, current);
			expect(diff.modified.tools).toHaveProperty("Tool1");
			expect(diff.added.tools).toEqual({});
			expect(diff.removed.tools).toEqual({});
		});
	});

	describe("normalizeSecurityPolicy", () => {
		it("should add missing defaults", () => {
			const partialPolicy: Partial<SecurityPolicy> = {
				tools: {},
				categories: {},
			};

			const normalized = normalizeSecurityPolicy(partialPolicy);

			expect(normalized.defaults).toBeDefined();
			expect(normalized.defaults['none']).toBeDefined();
			expect(normalized.defaults['critical']).toBeDefined();
		});

		it("should preserve existing values", () => {
			const partialPolicy = {
				tools: { TestTool: { securityLevel: 'high' } },
				defaults: {
					['low']: { requirePermission: false },
				},
			} satisfies SecurityPolicy;

			const normalized = normalizeSecurityPolicy(partialPolicy);

			expect(normalized.tools.TestTool.securityLevel).toBe('high');
			expect(normalized.defaults['low'].requirePermission).toBe(
				false,
			);
		});

		it("should handle empty input", () => {
			const normalized = normalizeSecurityPolicy({});

			expect(normalized.tools).toEqual({});
			expect(normalized.categories).toEqual({});
			expect(normalized.defaults).toBeDefined();
			expect(normalized.parameterRules).toEqual({});
		});
	});
});
