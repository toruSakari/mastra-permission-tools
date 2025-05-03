import { SecurityLevelEnum, SecurityLevel } from "../types/security";

/**
 * セキュリティレベルを数値に変換する
 * @param level セキュリティレベル
 * @returns 数値化されたセキュリティレベル
 */
export function getSecurityLevelValue(level?: SecurityLevel): number {
	const values: Record<SecurityLevel, number> = {
		none: 0,
		low: 1,
		medium: 2,
		high: 3,
		critical: 4,
	};

	return level ? values[level] : -1;
}

/**
 * 2つのセキュリティレベルを比較する
 * @param level1 最初のセキュリティレベル
 * @param level2 2番目のセキュリティレベル
 * @returns level1 > level2の場合は正の値、level1 < level2の場合は負の値、等しい場合は0
 */
export function compareSecurityLevels(
	level1?: SecurityLevel,
	level2?: SecurityLevel,
): number {
	return getSecurityLevelValue(level1) - getSecurityLevelValue(level2);
}

/**
 * より高いセキュリティレベルを返す
 * @param level1 最初のセキュリティレベル
 * @param level2 2番目のセキュリティレベル
 * @returns より高いセキュリティレベル
 */
export function getHigherSecurityLevel(
	level1?: SecurityLevel,
	level2?: SecurityLevel,
): SecurityLevel {
	if (!level1 && !level2) return "medium";
	if (!level1) return level2!;
	if (!level2) return level1;

	return compareSecurityLevels(level1, level2) > 0 ? level1 : level2;
}

/**
 * デフォルトのセキュリティレベル設定
 */
export const DEFAULT_SECURITY_LEVELS: Record<
	SecurityLevel,
	{
		requirePermission: boolean;
		expiry?: string;
		requireConfirmation?: boolean;
	}
> = {
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
};

/**
 * セキュリティレベルが有効かどうかを確認する
 * @param value 確認する値
 * @returns 有効なセキュリティレベルかどうか
 */
export function isValidSecurityLevel(value: any): value is SecurityLevel {
	return Object.values(SecurityLevelEnum).includes(value);
}
