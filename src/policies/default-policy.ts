import { SecurityPolicy } from "../types/security";
import { CommonParameterRules } from "../rules/parameter-rules";

/**
 * デフォルトのセキュリティポリシー
 */
export const defaultSecurityPolicy = {
	tools: {},
	categories: {
		internal: { securityLevel: "none" },
		read: { securityLevel: "low" },
		write: { securityLevel: "medium" },
		external: { securityLevel: "medium" },
		financial: { securityLevel: "high" },
		admin: { securityLevel: "critical" },
	},
	defaults: {
		none: {
			requirePermission: false,
		},
		low: {
			requirePermission: true,
			expiry: "24h",
		},
		medium: {
			requirePermission: true,
			expiry: "1h",
		},
		high: {
			requirePermission: true,
			expiry: "session",
		},
		critical: {
			requirePermission: true,
			expiry: "once",
			requireConfirmation: true,
		},
	},
	parameterRules: {},
} satisfies SecurityPolicy;
/**
 * 開発環境用のセキュリティポリシー
 */
export const developmentSecurityPolicy = {
	...defaultSecurityPolicy,
	defaults: {
		...defaultSecurityPolicy.defaults,
		high: {
			requirePermission: true,
			expiry: "24h", // 開発中は長めの有効期限
		},
		critical: {
			requirePermission: true,
			expiry: "1h", // 開発中はCRITICALでも1時間有効
			requireConfirmation: true,
		},
	},
} satisfies SecurityPolicy;

/**
 * 制限的なセキュリティポリシー
 */
export const restrictiveSecurityPolicy = {
	...defaultSecurityPolicy,
	defaults: {
		none: {
			requirePermission: false,
		},
		low: {
			requirePermission: true,
			expiry: "1h",
		},
		medium: {
			requirePermission: true,
			expiry: "30m",
		},
		high: {
			requirePermission: true,
			expiry: "once",
			requireConfirmation: true,
		},
		critical: {
			requirePermission: true,
			expiry: "once",
			requireConfirmation: true,
		},
	},
} satisfies SecurityPolicy;

/**
 * カスタムポリシーを作成するヘルパー関数
 * @param basePolicy ベースとなるポリシー
 * @param customizations カスタマイズする設定
 */
export function createCustomPolicy(
	basePolicy: SecurityPolicy,
	customizations: Partial<SecurityPolicy>,
): SecurityPolicy {
	return {
		tools: {
			...basePolicy.tools,
			...customizations.tools,
		},
		categories: {
			...basePolicy.categories,
			...customizations.categories,
		},
		defaults: {
			...basePolicy.defaults,
			...customizations.defaults,
		},
		parameterRules: {
			...basePolicy.parameterRules,
			...customizations.parameterRules,
		},
	};
}

/**
 * 一般的なツール用のプリセットポリシー
 */
export const commonToolPolicies = {
	databaseAccess: {
		...defaultSecurityPolicy,
		tools: {
			QueryDatabase: {
				securityLevel: "medium",
				category: "data",
				permissionMessage: "Database access required for data retrieval",
			},
			UpdateDatabase: {
				securityLevel: "high",
				category: "data",
				permissionMessage: "Database modification requires approval",
			},
		},
		parameterRules: {
			QueryDatabase: [CommonParameterRules.dataAccess.sensitiveFields],
			UpdateDatabase: [CommonParameterRules.dataAccess.bulkAccess],
		},
	},

	fileOperations: {
		...defaultSecurityPolicy,
		tools: {
			ReadFile: {
				securityLevel: "low",
				category: "read",
				permissionMessage: "File read access required",
			},
			WriteFile: {
				securityLevel: "medium",
				category: "write",
				permissionMessage: "File write access required",
			},
			DeleteFile: {
				securityLevel: "high",
				category: "write",
				permissionMessage: "File deletion requires approval",
			},
		},
		parameterRules: {
			WriteFile: [CommonParameterRules.fileOperation.largeFile],
			DeleteFile: [CommonParameterRules.fileOperation.systemFiles],
		},
	},

	apiOperations: {
		...defaultSecurityPolicy,
		tools: {
			FetchAPI: {
				securityLevel: "low",
				category: "external",
				permissionMessage: "External API call requires permission",
			},
			PostAPI: {
				securityLevel: "medium",
				category: "external",
				permissionMessage: "External API modification requires approval",
			},
		},
		parameterRules: {
			FetchAPI: [CommonParameterRules.externalApi.untrustedDomain],
			PostAPI: [
				CommonParameterRules.externalApi.untrustedDomain,
				CommonParameterRules.externalApi.highFrequency,
			],
		},
	},
} satisfies Record<string, SecurityPolicy>;
