import { SecurityPolicy, SecurityLevel } from '../types/security';
import { validateRule } from '../rules/rule-evaluator';
import { isValidSecurityLevel } from '../core/security-levels';

/**
 * セキュリティポリシーのバリデーション結果
 */
export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * セキュリティポリシーをバリデーションする
 * @param policy バリデーションするポリシー
 */
export function validateSecurityPolicy(policy: SecurityPolicy): PolicyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 基本構造のチェック
  if (!policy || typeof policy !== 'object') {
    errors.push('Security policy must be an object');
    return { valid: false, errors, warnings };
  }

  // 必須フィールドのチェック
  if (!policy.tools || typeof policy.tools !== 'object') {
    errors.push('Security policy must have a tools property');
  }

  if (!policy.categories || typeof policy.categories !== 'object') {
    errors.push('Security policy must have a categories property');
  }

  if (!policy.defaults || typeof policy.defaults !== 'object') {
    errors.push('Security policy must have a defaults property');
  }

  // ツール設定のバリデーション
  if (policy.tools) {
    for (const [toolName, metadata] of Object.entries(policy.tools)) {
      if (metadata.securityLevel && !isValidSecurityLevel(metadata.securityLevel)) {
        errors.push(`Invalid security level for tool "${toolName}": ${metadata.securityLevel}`);
      }

      if (metadata.category && !policy.categories[metadata.category]) {
        warnings.push(`Tool "${toolName}" references undefined category: ${metadata.category}`);
      }
    }
  }

  // カテゴリ設定のバリデーション
  if (policy.categories) {
    for (const [categoryName, config] of Object.entries(policy.categories)) {
      if (!isValidSecurityLevel(config.securityLevel)) {
        errors.push(`Invalid security level for category "${categoryName}": ${config.securityLevel}`);
      }
    }
  }

  // デフォルト設定のバリデーション
  if (policy.defaults) {
    // すべてのセキュリティレベルが定義されているか確認
    for (const level of Object.values(SecurityLevel)) {
      if (!policy.defaults[level]) {
        warnings.push(`Missing default configuration for security level: ${level}`);
      }
    }

    // 各デフォルト設定のバリデーション
    for (const [level, config] of Object.entries(policy.defaults)) {
      if (!isValidSecurityLevel(level as SecurityLevel)) {
        errors.push(`Invalid security level in defaults: ${level}`);
      }

      if (typeof config.requirePermission !== 'boolean') {
        errors.push(`Invalid requirePermission value for level ${level}`);
      }

      if (config.expiry && !isValidExpiry(config.expiry)) {
        errors.push(`Invalid expiry value for level ${level}: ${config.expiry}`);
      }
    }
  }

  // パラメータルールのバリデーション
  if (policy.parameterRules) {
    for (const [toolName, rules] of Object.entries(policy.parameterRules)) {
      if (!Array.isArray(rules)) {
        errors.push(`Parameter rules for tool "${toolName}" must be an array`);
        continue;
      }

      for (const rule of rules) {
        if (!validateRule(rule)) {
          errors.push(`Invalid parameter rule for tool "${toolName}"`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 有効期限の文字列が有効かどうかをチェックする
 * @param expiry 有効期限の文字列
 */
function isValidExpiry(expiry: string): boolean {
  const validPresets = ['once', 'session'];
  if (validPresets.includes(expiry)) {
    return true;
  }

  // パターンマッチング（例: "1h", "30m", "7d"）
  const pattern = /^(\d+)([mhd])$/;
  return pattern.test(expiry);
}

/**
 * 2つのセキュリティポリシーをマージする
 * @param policy1 最初のポリシー
 * @param policy2 2番目のポリシー
 */
export function mergeSecurityPolicies(
  policy1: SecurityPolicy,
  policy2: SecurityPolicy
): SecurityPolicy {
  return {
    tools: {
      ...policy1.tools,
      ...policy2.tools,
    },
    categories: {
      ...policy1.categories,
      ...policy2.categories,
    },
    defaults: {
      ...policy1.defaults,
      ...policy2.defaults,
    },
    parameterRules: {
      ...policy1.parameterRules,
      ...policy2.parameterRules,
    },
  };
}

/**
 * ポリシーの差分を計算する
 * @param original 元のポリシー
 * @param current 現在のポリシー
 */
export function calculatePolicyDiff(
  original: SecurityPolicy,
  current: SecurityPolicy
): {
  added: Partial<SecurityPolicy>;
  removed: Partial<SecurityPolicy>;
  modified: Partial<SecurityPolicy>;
} {
  const added: Partial<SecurityPolicy> = {};
  const removed: Partial<SecurityPolicy> = {};
  const modified: Partial<SecurityPolicy> = {};

  // ツールの差分
  added.tools = {};
  removed.tools = {};
  modified.tools = {};

  for (const [toolName, metadata] of Object.entries(current.tools)) {
    if (!original.tools[toolName]) {
      added.tools[toolName] = metadata;
    } else if (JSON.stringify(original.tools[toolName]) !== JSON.stringify(metadata)) {
      modified.tools[toolName] = metadata;
    }
  }

  for (const toolName of Object.keys(original.tools)) {
    if (!current.tools[toolName]) {
      removed.tools[toolName] = original.tools[toolName];
    }
  }

  // 他のプロパティも同様に差分を計算...

  return { added, removed, modified };
}

/**
 * セキュリティポリシーを安全な形式に正規化する
 * @param policy ポリシー
 */
export function normalizeSecurityPolicy(policy: Partial<SecurityPolicy>): SecurityPolicy {
  const normalizedPolicy: SecurityPolicy = {
    tools: policy.tools || {},
    categories: policy.categories || {},
    defaults: policy.defaults || {},
    parameterRules: policy.parameterRules || {},
  };

  // デフォルト値で欠けているセキュリティレベルを補完
  for (const level of Object.values(SecurityLevel)) {
    if (!normalizedPolicy.defaults[level]) {
      normalizedPolicy.defaults[level] = {
        requirePermission: level !== SecurityLevel.NONE,
        expiry: level === SecurityLevel.CRITICAL ? 'once' : '1h',
      };
    }
  }

  return normalizedPolicy;
}