import { SecurityLevel } from '../types/security';

/**
 * セキュリティレベルを数値に変換する
 * @param level セキュリティレベル
 * @returns 数値化されたセキュリティレベル
 */
export function getSecurityLevelValue(level?: SecurityLevel): number {
  const values: Record<SecurityLevel, number> = {
    [SecurityLevel.NONE]: 0,
    [SecurityLevel.LOW]: 1,
    [SecurityLevel.MEDIUM]: 2,
    [SecurityLevel.HIGH]: 3,
    [SecurityLevel.CRITICAL]: 4,
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
  level2?: SecurityLevel
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
  level2?: SecurityLevel
): SecurityLevel {
  if (!level1 && !level2) return SecurityLevel.MEDIUM;
  if (!level1) return level2!;
  if (!level2) return level1;

  return compareSecurityLevels(level1, level2) > 0 ? level1 : level2;
}

/**
 * デフォルトのセキュリティレベル設定
 */
export const DEFAULT_SECURITY_LEVELS: Record<SecurityLevel, {
  requirePermission: boolean;
  expiry?: string;
  requireConfirmation?: boolean;
}> = {
  [SecurityLevel.NONE]: {
    requirePermission: false,
  },
  [SecurityLevel.LOW]: {
    requirePermission: true,
    expiry: '24h',
  },
  [SecurityLevel.MEDIUM]: {
    requirePermission: true,
    expiry: '1h',
  },
  [SecurityLevel.HIGH]: {
    requirePermission: true,
    expiry: 'session',
  },
  [SecurityLevel.CRITICAL]: {
    requirePermission: true,
    expiry: 'once',
    requireConfirmation: true,
  },
};

/**
 * セキュリティレベルの表示名を取得する
 * @param level セキュリティレベル
 * @returns 表示名
 */
export function getSecurityLevelDisplayName(level: SecurityLevel): string {
  const displayNames: Record<SecurityLevel, string> = {
    [SecurityLevel.NONE]: 'None',
    [SecurityLevel.LOW]: 'Low',
    [SecurityLevel.MEDIUM]: 'Medium',
    [SecurityLevel.HIGH]: 'High',
    [SecurityLevel.CRITICAL]: 'Critical',
  };

  return displayNames[level];
}

/**
 * セキュリティレベルに応じた色を取得する（UIコンポーネント用）
 * @param level セキュリティレベル
 * @returns カラーコード
 */
export function getSecurityLevelColor(level: SecurityLevel): string {
  const colors: Record<SecurityLevel, string> = {
    [SecurityLevel.NONE]: '#6b7280', // gray
    [SecurityLevel.LOW]: '#22c55e', // green
    [SecurityLevel.MEDIUM]: '#eab308', // yellow
    [SecurityLevel.HIGH]: '#f97316', // orange
    [SecurityLevel.CRITICAL]: '#ef4444', // red
  };

  return colors[level];
}

/**
 * セキュリティレベルの説明を取得する
 * @param level セキュリティレベル
 * @returns 説明文
 */
export function getSecurityLevelDescription(level: SecurityLevel): string {
  const descriptions: Record<SecurityLevel, string> = {
    [SecurityLevel.NONE]: 'No permission required',
    [SecurityLevel.LOW]: 'Basic operations with minimal risk',
    [SecurityLevel.MEDIUM]: 'Operations that may access user data or external services',
    [SecurityLevel.HIGH]: 'Sensitive operations that require special attention',
    [SecurityLevel.CRITICAL]: 'Critical operations that may have significant impact',
  };

  return descriptions[level];
}

/**
 * 文字列からセキュリティレベルに変換する
 * @param value セキュリティレベルの文字列
 * @returns セキュリティレベル
 */
export function parseSecurityLevel(value: string): SecurityLevel {
  const normalizedValue = value.toLowerCase();
  
  if (Object.values(SecurityLevel).includes(normalizedValue as SecurityLevel)) {
    return normalizedValue as SecurityLevel;
  }

  throw new Error(`Invalid security level: ${value}`);
}

/**
 * セキュリティレベルが有効かどうかを確認する
 * @param value 確認する値
 * @returns 有効なセキュリティレベルかどうか
 */
export function isValidSecurityLevel(value: any): value is SecurityLevel {
  return Object.values(SecurityLevel).includes(value);
}