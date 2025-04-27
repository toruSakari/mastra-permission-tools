import { describe, it, expect } from "vitest";
import {
	CommonParameterRules,
	createRuleSet,
	createPresetRuleSet,
} from "../../src/rules/parameter-rules";
import { SecurityLevel } from "../../src/types/security";

describe("parameter-rules", () => {
	describe("CommonParameterRules", () => {
		describe("financial rules", () => {
			it("should define high value transaction rule", () => {
				const rule = CommonParameterRules.financial.highValueTransaction;
				expect(rule.param).toBe("amount");
				expect(rule.condition).toBe("greaterThan");
				expect(rule.value).toBe(1000);
				expect(rule.securityLevel).toBe(SecurityLevel.HIGH);
			});

			it("should define critical value transaction rule", () => {
				const rule = CommonParameterRules.financial.criticalValueTransaction;
				expect(rule.param).toBe("amount");
				expect(rule.condition).toBe("greaterThan");
				expect(rule.value).toBe(10000);
				expect(rule.securityLevel).toBe(SecurityLevel.CRITICAL);
			});

			it("should define unknown recipient rule", () => {
				const rule = CommonParameterRules.financial.unknownRecipient;
				expect(rule.param).toBe("recipient");
				expect(rule.condition).toBe("equals");
				expect(rule.value).toBe("unknown");
				expect(rule.securityLevel).toBe(SecurityLevel.HIGH);
			});
		});

		describe("dataAccess rules", () => {
			it("should define sensitive fields rule", () => {
				const rule = CommonParameterRules.dataAccess.sensitiveFields;
				expect(rule.param).toBe("fields");
				expect(rule.condition).toBe("contains");
				expect(rule.value).toEqual(["ssn", "credit_card", "password"]);
				expect(rule.securityLevel).toBe(SecurityLevel.HIGH);
			});

			it("should define bulk access rule", () => {
				const rule = CommonParameterRules.dataAccess.bulkAccess;
				expect(rule.param).toBe("records");
				expect(rule.condition).toBe("greaterThan");
				expect(rule.value).toBe(100);
				expect(rule.securityLevel).toBe(SecurityLevel.MEDIUM);
			});
		});

		describe("externalApi rules", () => {
			it("should define untrusted domain rule", () => {
				const rule = CommonParameterRules.externalApi.untrustedDomain;
				expect(rule.param).toBe("url");
				expect(rule.condition).toBe("regex");
				expect(rule.value).toBe(
					"^(?!https://(api\\.trusted\\.com|api\\.partner\\.com))",
				);
				expect(rule.securityLevel).toBe(SecurityLevel.MEDIUM);
			});

			it("should define high frequency rule", () => {
				const rule = CommonParameterRules.externalApi.highFrequency;
				expect(rule.param).toBe("requestsPerMinute");
				expect(rule.condition).toBe("greaterThan");
				expect(rule.value).toBe(100);
				expect(rule.securityLevel).toBe(SecurityLevel.MEDIUM);
			});
		});

		describe("fileOperation rules", () => {
			it("should define system files rule", () => {
				const rule = CommonParameterRules.fileOperation.systemFiles;
				expect(rule.param).toBe("path");
				expect(rule.condition).toBe("startsWith");
				expect(rule.value).toBe("/system");
				expect(rule.securityLevel).toBe(SecurityLevel.CRITICAL);
			});

			it("should define large file rule", () => {
				const rule = CommonParameterRules.fileOperation.largeFile;
				expect(rule.param).toBe("size");
				expect(rule.condition).toBe("greaterThan");
				expect(rule.value).toBe(10 * 1024 * 1024); // 10MB
				expect(rule.securityLevel).toBe(SecurityLevel.MEDIUM);
			});
		});
	});

	describe("createRuleSet", () => {
		it("should create rule set with tool names", () => {
			const rules = [
				{
					param: "amount",
					condition: "greaterThan" as const,
					value: 100,
					toolName: "PaymentTool",
				},
				{
					param: "size",
					condition: "lessThan" as const,
					value: 1000,
					toolName: "FileTool",
				},
				{
					param: "rate",
					condition: "equals" as const,
					value: 0.5,
					toolName: "PaymentTool",
				},
			];

			const ruleSet = createRuleSet(rules);

			expect(Object.keys(ruleSet)).toEqual(["PaymentTool", "FileTool"]);
			expect(ruleSet.PaymentTool).toHaveLength(2);
			expect(ruleSet.FileTool).toHaveLength(1);
		});

		it("should use default tool name when not specified", () => {
			const rules = [
				{ param: "amount", condition: "greaterThan" as const, value: 100 },
				{ param: "size", condition: "lessThan" as const, value: 1000 },
			];

			const ruleSet = createRuleSet(rules);

			expect(Object.keys(ruleSet)).toEqual(["default"]);
			expect(ruleSet.default).toHaveLength(2);
		});

		it("should handle empty rule array", () => {
			const ruleSet = createRuleSet([]);
			expect(ruleSet).toEqual({});
		});
	});

	describe("createPresetRuleSet", () => {
		it("should create preset rule set with correct tool mappings", () => {
			const presetRuleSet = createPresetRuleSet();

			expect(Object.keys(presetRuleSet)).toContain("ProcessPayment");
			expect(Object.keys(presetRuleSet)).toContain("AccessDatabase");
			expect(Object.keys(presetRuleSet)).toContain("CallExternalAPI");
			expect(Object.keys(presetRuleSet)).toContain("FileOperation");
		});

		it("should include correct rules for ProcessPayment", () => {
			const presetRuleSet = createPresetRuleSet();
			const paymentRules = presetRuleSet.ProcessPayment;

			expect(paymentRules).toHaveLength(3);
			expect(paymentRules).toContainEqual(
				CommonParameterRules.financial.highValueTransaction,
			);
			expect(paymentRules).toContainEqual(
				CommonParameterRules.financial.criticalValueTransaction,
			);
			expect(paymentRules).toContainEqual(
				CommonParameterRules.financial.unknownRecipient,
			);
		});

		it("should include correct rules for AccessDatabase", () => {
			const presetRuleSet = createPresetRuleSet();
			const databaseRules = presetRuleSet.AccessDatabase;

			expect(databaseRules).toHaveLength(2);
			expect(databaseRules).toContainEqual(
				CommonParameterRules.dataAccess.sensitiveFields,
			);
			expect(databaseRules).toContainEqual(
				CommonParameterRules.dataAccess.bulkAccess,
			);
		});

		it("should include correct rules for CallExternalAPI", () => {
			const presetRuleSet = createPresetRuleSet();
			const apiRules = presetRuleSet.CallExternalAPI;

			expect(apiRules).toHaveLength(2);
			expect(apiRules).toContainEqual(
				CommonParameterRules.externalApi.untrustedDomain,
			);
			expect(apiRules).toContainEqual(
				CommonParameterRules.externalApi.highFrequency,
			);
		});

		it("should include correct rules for FileOperation", () => {
			const presetRuleSet = createPresetRuleSet();
			const fileRules = presetRuleSet.FileOperation;

			expect(fileRules).toHaveLength(2);
			expect(fileRules).toContainEqual(
				CommonParameterRules.fileOperation.systemFiles,
			);
			expect(fileRules).toContainEqual(
				CommonParameterRules.fileOperation.largeFile,
			);
		});
	});
});
