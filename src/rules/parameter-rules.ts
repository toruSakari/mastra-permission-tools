import { ParameterRule } from "../types/rules";
import { RuleFactory } from "./rule-evaluator";

/**
 * ツール名を含むパラメータルール
 */
export interface ParameterRuleWithTool extends ParameterRule {
	toolName?: string;
}

/**
 * 一般的なパラメータルールのプリセット
 */
export const CommonParameterRules = {
	/**
	 * 金融取引用のルール
	 */
	financial: {
		highValueTransaction: RuleFactory.amountGreaterThan(
			1000,
			"high",
			"High-value transaction requires additional approval",
		),
		criticalValueTransaction: RuleFactory.amountGreaterThan(
			10000,
			"critical",
			"Critical-value transaction requires special authorization",
		),
		unknownRecipient: {
			param: "recipient",
			condition: "equals" as const,
			value: "unknown",
			securityLevel: "high",
			message: "Transaction to unknown recipient requires approval",
		},
	},

	/**
	 * データアクセス用のルール
	 */
	dataAccess: {
		sensitiveFields: {
			param: "fields",
			condition: "contains" as const,
			value: ["ssn", "credit_card", "password"],
			securityLevel: "high",
			message: "Accessing sensitive data fields requires approval",
		},
		bulkAccess: RuleFactory.arrayLengthGreaterThan(
			"records",
			100,
			"medium",
			"Bulk data access requires approval",
		),
	},

	/**
	 * 外部API呼び出し用のルール
	 */
	externalApi: {
		untrustedDomain: {
			param: "url",
			condition: "regex" as const,
			value: "^(?!https://(api\\.trusted\\.com|api\\.partner\\.com))",
			securityLevel: "medium",
			message: "External API call to untrusted domain requires approval",
		},
		highFrequency: {
			param: "requestsPerMinute",
			condition: "greaterThan" as const,
			value: 100,
			securityLevel: "medium",
			message: "High-frequency API calls require approval",
		},
	},

	/**
	 * ファイル操作用のルール
	 */
	fileOperation: {
		systemFiles: {
			param: "path",
			condition: "startsWith" as const,
			value: "/system",
			securityLevel: "critical",
			message: "System file access requires critical approval",
		},
		largeFile: {
			param: "size",
			condition: "greaterThan" as const,
			value: 10 * 1024 * 1024, // 10MB
			securityLevel: "medium",
			message: "Large file operation requires approval",
		},
	},
} satisfies Record<string, Record<string, ParameterRule>>;

/**
 * ルールセットを作成するユーティリティ関数
 * @param rules ルールの配列
 */
export function createRuleSet(
	rules: ParameterRuleWithTool[],
): Record<string, ParameterRule[]> {
	return rules.reduce(
		(acc, rule) => {
			const toolName = rule.toolName || "default";
			if (!acc[toolName]) {
				acc[toolName] = [];
			}
			// toolNameを除いた元のParameterRuleを追加
			const { toolName: _, ...baseRule } = rule;
			acc[toolName].push(baseRule);
			return acc;
		},
		{} as Record<string, ParameterRule[]>,
	);
}

/**
 * プリセットルールセットを作成する
 */
export function createPresetRuleSet(): Record<string, ParameterRule[]> {
	return {
		ProcessPayment: [
			CommonParameterRules.financial.highValueTransaction,
			CommonParameterRules.financial.criticalValueTransaction,
			CommonParameterRules.financial.unknownRecipient,
		],
		AccessDatabase: [
			CommonParameterRules.dataAccess.sensitiveFields,
			CommonParameterRules.dataAccess.bulkAccess,
		],
		CallExternalAPI: [
			CommonParameterRules.externalApi.untrustedDomain,
			CommonParameterRules.externalApi.highFrequency,
		],
		FileOperation: [
			CommonParameterRules.fileOperation.systemFiles,
			CommonParameterRules.fileOperation.largeFile,
		],
	};
}
