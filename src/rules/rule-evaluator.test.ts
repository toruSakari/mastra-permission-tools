import { describe, it, expect } from "vitest";
import {
	evaluateRule,
	evaluateParameterRules,
	createRule,
	RuleFactory,
} from "../../src/rules/rule-evaluator";
import { SecurityLevel } from "../../src/types/security";

describe("rule-evaluator", () => {
	describe("evaluateRule", () => {
		it("should evaluate equals condition", () => {
			const rule = {
				param: "value",
				condition: "equals" as const,
				value: "test",
			};
			expect(evaluateRule(rule, { value: "test" })).toBe(true);
			expect(evaluateRule(rule, { value: "other" })).toBe(false);
		});

		it("should evaluate contains condition", () => {
			const rule = {
				param: "text",
				condition: "contains" as const,
				value: "test",
			};
			expect(evaluateRule(rule, { text: "this is a test" })).toBe(true);
			expect(evaluateRule(rule, { text: "no match" })).toBe(false);
		});

		it("should evaluate greaterThan condition", () => {
			const rule = {
				param: "amount",
				condition: "greaterThan" as const,
				value: 100,
			};
			expect(evaluateRule(rule, { amount: 150 })).toBe(true);
			expect(evaluateRule(rule, { amount: 50 })).toBe(false);
		});

		it("should evaluate regex condition", () => {
			const rule = {
				param: "email",
				condition: "regex" as const,
				value: "^[a-z]+@[a-z]+\\.com$",
			};
			expect(evaluateRule(rule, { email: "test@example.com" })).toBe(true);
			expect(evaluateRule(rule, { email: "invalid-email" })).toBe(false);
		});

		it("should handle invalid regex gracefully", () => {
			const rule = {
				param: "text",
				condition: "regex" as const,
				value: "[invalid",
			};
			expect(evaluateRule(rule, { text: "test" })).toBe(false);
		});

		it("should return false for missing parameters", () => {
			const rule = {
				param: "missing",
				condition: "equals" as const,
				value: "test",
			};
			expect(evaluateRule(rule, {})).toBe(false);
		});
	});

	describe("evaluateParameterRules", () => {
		it("should evaluate multiple rules", () => {
			const rules = {
				testTool: [
					{
						param: "amount",
						condition: "greaterThan" as const,
						value: 100,
						securityLevel: SecurityLevel.HIGH,
					},
					{
						param: "type",
						condition: "equals" as const,
						value: "sensitive",
						securityLevel: SecurityLevel.CRITICAL,
					},
				],
			};

			const result = evaluateParameterRules(
				"testTool",
				{ amount: 150, type: "sensitive" },
				rules,
			);

			expect(result.securityLevel).toBe(SecurityLevel.CRITICAL);
			expect(result.matchedRules).toHaveLength(2);
		});

		it("should prioritize higher security levels", () => {
			const rules = {
				testTool: [
					{
						param: "amount",
						condition: "greaterThan" as const,
						value: 100,
						securityLevel: SecurityLevel.LOW,
					},
					{
						param: "amount",
						condition: "greaterThan" as const,
						value: 1000,
						securityLevel: SecurityLevel.HIGH,
					},
				],
			};

			const result = evaluateParameterRules(
				"testTool",
				{ amount: 2000 },
				rules,
			);

			expect(result.securityLevel).toBe(SecurityLevel.HIGH);
		});

		it("should handle no matching rules", () => {
			const rules = {
				testTool: [
					{ param: "amount", condition: "greaterThan" as const, value: 100 },
				],
			};

			const result = evaluateParameterRules("testTool", { amount: 50 }, rules);

			expect(result.securityLevel).toBeUndefined();
			expect(result.matchedRules).toHaveLength(0);
		});
	});

	describe("RuleFactory", () => {
		it("should create amountGreaterThan rule", () => {
			const rule = RuleFactory.amountGreaterThan(1000, SecurityLevel.HIGH);

			expect(rule.param).toBe("amount");
			expect(rule.condition).toBe("greaterThan");
			expect(rule.value).toBe(1000);
			expect(rule.securityLevel).toBe(SecurityLevel.HIGH);
		});

		it("should create patternMatches rule", () => {
			const rule = RuleFactory.patternMatches(
				"email",
				"^[a-z]+@[a-z]+\\.com$",
				SecurityLevel.MEDIUM,
			);

			expect(rule.param).toBe("email");
			expect(rule.condition).toBe("regex");
			expect(rule.value).toBe("^[a-z]+@[a-z]+\\.com$");
		});
	});
});
