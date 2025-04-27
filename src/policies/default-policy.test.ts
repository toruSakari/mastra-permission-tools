import { describe, it, expect } from "vitest";
import {
	defaultSecurityPolicy,
	developmentSecurityPolicy,
	restrictiveSecurityPolicy,
	createCustomPolicy,
	commonToolPolicies,
} from "./default-policy";
import { SecurityLevel } from "../types/security";

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
				SecurityLevel.NONE,
			);
			expect(defaultSecurityPolicy.categories.read.securityLevel).toBe(
				SecurityLevel.LOW,
			);
			expect(defaultSecurityPolicy.categories.write.securityLevel).toBe(
				SecurityLevel.MEDIUM,
			);
			expect(defaultSecurityPolicy.categories.external.securityLevel).toBe(
				SecurityLevel.MEDIUM,
			);
			expect(defaultSecurityPolicy.categories.financial.securityLevel).toBe(
				SecurityLevel.HIGH,
			);
			expect(defaultSecurityPolicy.categories.admin.securityLevel).toBe(
				SecurityLevel.CRITICAL,
			);
		});

		it("should have correct default security level settings", () => {
			expect(
				defaultSecurityPolicy.defaults[SecurityLevel.NONE].requirePermission,
			).toBe(false);
			expect(
				defaultSecurityPolicy.defaults[SecurityLevel.LOW].requirePermission,
			).toBe(true);
			expect(defaultSecurityPolicy.defaults[SecurityLevel.LOW].expiry).toBe(
				"24h",
			);
			expect(
				defaultSecurityPolicy.defaults[SecurityLevel.CRITICAL].expiry,
			).toBe("once");
			expect(
				defaultSecurityPolicy.defaults[SecurityLevel.CRITICAL]
					.requireConfirmation,
			).toBe(true);
		});
	});

	describe("developmentSecurityPolicy", () => {
		it("should extend defaultSecurityPolicy with longer expiry times", () => {
			expect(
				developmentSecurityPolicy.defaults[SecurityLevel.HIGH].expiry,
			).toBe("24h");
			expect(
				developmentSecurityPolicy.defaults[SecurityLevel.CRITICAL].expiry,
			).toBe("1h");
			expect(developmentSecurityPolicy.categories).toEqual(
				defaultSecurityPolicy.categories,
			);
		});
	});

	describe("restrictiveSecurityPolicy", () => {
		it("should have shorter expiry times than default", () => {
			expect(restrictiveSecurityPolicy.defaults[SecurityLevel.LOW].expiry).toBe(
				"1h",
			);
			expect(
				restrictiveSecurityPolicy.defaults[SecurityLevel.MEDIUM].expiry,
			).toBe("30m");
			expect(
				restrictiveSecurityPolicy.defaults[SecurityLevel.HIGH].expiry,
			).toBe("once");
			expect(
				restrictiveSecurityPolicy.defaults[SecurityLevel.HIGH]
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
						securityLevel: SecurityLevel.HIGH,
						category: "custom",
					},
				},
				categories: {
					custom: { securityLevel: SecurityLevel.MEDIUM },
				},
			};

			const customPolicy = createCustomPolicy(basePolicy, customizations);

			expect(customPolicy.tools.CustomTool).toBeDefined();
			expect(customPolicy.tools.CustomTool.securityLevel).toBe(
				SecurityLevel.HIGH,
			);
			expect(customPolicy.categories.custom).toBeDefined();
			expect(customPolicy.categories.custom.securityLevel).toBe(
				SecurityLevel.MEDIUM,
			);
			expect(customPolicy.categories.internal).toBeDefined(); // Base policy preserved
		});

		it("should override existing values", () => {
			const basePolicy = defaultSecurityPolicy;
			const customizations = {
				categories: {
					read: { securityLevel: SecurityLevel.HIGH },
				},
			};

			const customPolicy = createCustomPolicy(basePolicy, customizations);

			expect(customPolicy.categories.read.securityLevel).toBe(
				SecurityLevel.HIGH,
			);
			expect(customPolicy.categories.write.securityLevel).toBe(
				SecurityLevel.MEDIUM,
			); // Unchanged
		});
	});

	describe("commonToolPolicies", () => {
		describe("databaseAccess", () => {
			it("should define correct tools and rules", () => {
				const { tools, parameterRules } = commonToolPolicies.databaseAccess;

				expect(tools.QueryDatabase.securityLevel).toBe(SecurityLevel.MEDIUM);
				expect(tools.UpdateDatabase.securityLevel).toBe(SecurityLevel.HIGH);
				expect(parameterRules.QueryDatabase).toHaveLength(1);
				expect(parameterRules.UpdateDatabase).toHaveLength(1);
			});
		});

		describe("fileOperations", () => {
			it("should define correct security levels for file operations", () => {
				const { tools } = commonToolPolicies.fileOperations;

				expect(tools.ReadFile.securityLevel).toBe(SecurityLevel.LOW);
				expect(tools.WriteFile.securityLevel).toBe(SecurityLevel.MEDIUM);
				expect(tools.DeleteFile.securityLevel).toBe(SecurityLevel.HIGH);
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

				expect(tools.FetchAPI.securityLevel).toBe(SecurityLevel.LOW);
				expect(tools.PostAPI.securityLevel).toBe(SecurityLevel.MEDIUM);
				expect(parameterRules.FetchAPI).toHaveLength(1);
				expect(parameterRules.PostAPI).toHaveLength(2);
			});
		});
	});
});
