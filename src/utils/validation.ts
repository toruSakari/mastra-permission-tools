import { SecurityLevel } from '../types/security';
import { ParameterCondition } from '../types/rules';

/**
 * セキュリティレベルが有効かどうかを検証する
 * @param value 検証する値
 */
export function isValidSecurityLevel(value: any): value is SecurityLevel {
  return Object.values(SecurityLevel).includes(value);
}

/**
 * パラメータ条件が有効かどうかを検証する
 * @param value 検証する値
 */
export function isValidParameterCondition(value: any): value is ParameterCondition {
  const validConditions: ParameterCondition[] = [
    'equals',
    'contains',
    'startsWith',
    'endsWith',
    'regex',
    'greaterThan',
    'lessThan',
  ];
  return validConditions.includes(value);
}

/**
 * 有効期限の文字列が有効かどうかを検証する
 * @param expiry 有効期限の文字列
 */
export function isValidExpiry(expiry: string): boolean {
  if (expiry === 'once' || expiry === 'session') {
    return true;
  }

  // パターンマッチング（例: "30m", "2h", "7d"）
  const pattern = /^(\d+)([mhd])$/;
  return pattern.test(expiry);
}

/**
 * JSONかどうかを検証する
 * @param str 検証する文字列
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * オブジェクトが空かどうかを検証する
 * @param obj 検証するオブジェクト
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}