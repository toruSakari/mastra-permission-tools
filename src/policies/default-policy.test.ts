import { describe, it, expect } from "vitest";
import {
	defaultSecurityPolicy,
	developmentSecurityPolicy,
	restrictiveSecurityPolicy,
	createCustomPolicy,
	commonToolPolicies,
} from "./default-policy";
import { SecurityPolicy } from "../types/security";

describe("default-policy", () => {
	describe("defaultSecurityPolicy", () => {
		it("should have correct default structure", () => {
			expect(defaultSecurityPolicy).toHaveProperty("tools");
			expect(defaultSecurityPolicy).toHaveProperty("categories");
			expect(defaultSecurityPolicy).toHaveProperty("defaults");
			expect(defaultSecurityPolicy).toHaveProperty("parameterRules");
		});

		it("should have correct category security levels", () => {
			expect(defaultSecurityPolicy.categories.internal.securityLevel).toBe(
				'none',
			);
			expect(defaultSecurityPolicy.categories.read.securityLevel).toBe(
				'low',
			);
			expect(defaultSecurityPolicy.categories.write.securityLevel).toBe(
				'medium',
			);
			expect(defaultSecurityPolicy.categories.external.securityLevel).toBe(
				'medium',
			);
			expect(defaultSecurityPolicy.categories.financial.securityLevel).toBe(
				'high',
			);
			expect(defaultSecurityPolicy.categories.admin.securityLevel).toBe(
				'critical',
			);
		});

		it("should have correct default security level settings", () => {
			expect(
				defaultSecurityPolicy.defaults['none'].requirePermission,
			).toBe(false);
			expect(
				defaultSecurityPolicy.defaults['low'].requirePermission,
			).toBe(true);
			expect(defaultSecurityPolicy.defaults['low'].expiry).toBe(
				"24h",
			);
			expect(
				defaultSecurityPolicy.defaults['critical'].expiry,
			).toBe("once");
			expect(
				defaultSecurityPolicy.defaults['critical']
					.requireConfirmation,
			).toBe(true);
		});
	});

	describe("developmentSecurityPolicy", () => {
		it("should extend defaultSecurityPolicy with longer expiry times", () => {
			expect(
				developmentSecurityPolicy.defaults['high'].expiry,
			).toBe("24h");
			expect(
				developmentSecurityPolicy.defaults['critical'].expiry,
			).toBe("1h");
			expect(developmentSecurityPolicy.categories).toEqual(
				defaultSecurityPolicy.categories,
			);
		});
	});

	describe("restrictiveSecurityPolicy", () => {
		it("should have shorter expiry times than default", () => {
			expect(restrictiveSecurityPolicy.defaults['low'].expiry).toBe(
				"1h",
			);
			expect(
				restrictiveSecurityPolicy.defaults['medium'].expiry,
			).toBe("30m");
			expect(
				restrictiveSecurityPolicy.defaults['high'].expiry,
			).toBe("once");
			expect(
				restrictiveSecurityPolicy.defaults['high']
					.requireConfirmation,
			).toBe(true);
		});
	});

	describe("createCustomPolicy", () => {
		it("should merge base policy with customizations", () => {
			const basePolicy = defaultSecurityPolicy;
			const customizations = {
				tools: {
					CustomTool: {
						securityLevel: 'high',
						category: "custom",
					},
				},
				categories: {
					custom: { securityLevel: 'medium' },
				},
			} satisfies Partial<SecurityPolicy>;

			const customPolicy = createCustomPolicy(basePolicy, customizations);

			expect(customPolicy.tools.CustomTool).toBeDefined();
			expect(customPolicy.tools.CustomTool.securityLevel).toBe(
				'high',
			);
			expect(customPolicy.categories!.custom).toBeDefined();
			expect(customPolicy.categories!.custom.securityLevel).toBe(
				'medium',
			);
			expect(customPolicy.categories!.internal).toBeDefined(); // Base policy preserved
		});

		it("should override existing values", () => {
			const basePolicy = defaultSecurityPolicy;
			const customizations = {
				categories: {
					read: { securityLevel: 'high' },
				},
			} satisfies Partial<SecurityPolicy>;

			const customPolicy = createCustomPolicy(basePolicy, customizations);

			expect(customPolicy.categories!.read.securityLevel).toBe(
				'high',
			);
			expect(customPolicy.categories!.write.securityLevel).toBe(
				'medium',
			); // Unchanged
		});
	});

	describe("commonToolPolicies", () => {
		describe("databaseAccess", () => {
			it("should define correct tools and rules", () => {
				const { tools, parameterRules } = commonToolPolicies.databaseAccess;

				expect(tools.QueryDatabase.securityLevel).toBe('medium');
				expect(tools.UpdateDatabase.securityLevel).toBe('high');
				expect(parameterRules.QueryDatabase).toHaveLength(1);
				expect(parameterRules.UpdateDatabase).toHaveLength(1);
			});
		});

		describe("fileOperations", () => {
			it("should define correct security levels for file operations", () => {
				const { tools } = commonToolPolicies.fileOperations;

				expect(tools.ReadFile.securityLevel).toBe('low');
				expect(tools.WriteFile.securityLevel).toBe('medium');
				expect(tools.DeleteFile.securityLevel).toBe('high');
			});

			it("should have correct parameter rules", () => {
				const { parameterRules } = commonToolPolicies.fileOperations;

				expect(parameterRules.WriteFile).toHaveLength(1);
				expect(parameterRules.DeleteFile).toHaveLength(1);
			});
		});

		describe("apiOperations", () => {
			it("should define correct tools and rules", () => {
				const { tools, parameterRules } = commonToolPolicies.apiOperations;

				expect(tools.FetchAPI.securityLevel).toBe('low');
				expect(tools.PostAPI.securityLevel).toBe('medium');
				expect(parameterRules.FetchAPI).toHaveLength(1);
				expect(parameterRules.PostAPI).toHaveLength(2);
			});
		});
	});
});
