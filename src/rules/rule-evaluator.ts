import { ParameterRule } from '../types/rules';
import { SecurityLevel } from '../types/security';
import { getHigherSecurityLevel } from '../core/security-levels';

export interface RuleEvaluationResult {
  securityLevel?: SecurityLevel;
  message?: string;
  matchedRules: ParameterRule[];
}

/**
 * パラメータルールを評価する
 * @param toolName ツール名
 * @param params パラメータ
 * @param rules ルールのマッピング
 */
export function evaluateParameterRules(
  toolName: string,
  params: Record<string, any>,
  rules: Record<string, ParameterRule[]>
): RuleEvaluationResult {
  const toolRules = rules[toolName] || [];
  const matchedRules: ParameterRule[] = [];
  let resultSecurityLevel: SecurityLevel | undefined;
  let resultMessage: string | undefined;

  for (const rule of toolRules) {
    if (evaluateRule(rule, params)) {
      matchedRules.push(rule);

      // より高いセキュリティレベルを優先
      if (rule.securityLevel) {
        resultSecurityLevel = getHigherSecurityLevel(
          resultSecurityLevel,
          rule.securityLevel
        );
      }

      // 最後にマッチしたルールのメッセージを使用
      if (rule.message) {
        resultMessage = rule.message;
      }
    }
  }

  return {
    securityLevel: resultSecurityLevel,
    message: resultMessage,
    matchedRules,
  };
}

/**
 * 単一のルールを評価する
 * @param rule ルール
 * @param params パラメータ
 */
export function evaluateRule(
  rule: ParameterRule,
  params: Record<string, any>
): boolean {
  const paramValue = params[rule.param];
  
  // パラメータが存在しない場合はマッチしない
  if (paramValue === undefined) {
    return false;
  }

  switch (rule.condition) {
    case 'equals':
      return paramValue === rule.value;

    case 'contains':
      return String(paramValue).includes(String(rule.value));

    case 'startsWith':
      return String(paramValue).startsWith(String(rule.value));

    case 'endsWith':
      return String(paramValue).endsWith(String(rule.value));

    case 'regex':
      try {
        return new RegExp(rule.value).test(String(paramValue));
      } catch (e) {
        console.error(`Invalid regex pattern: ${rule.value}`, e);
        return false;
      }

    case 'greaterThan':
      return Number(paramValue) > Number(rule.value);

    case 'lessThan':
      return Number(paramValue) < Number(rule.value);

    default:
      console.warn(`Unknown condition: ${rule.condition}`);
      return false;
  }
}

/**
 * ルールを作成するユーティリティ関数
 * @param param パラメータ名
 * @param condition 条件
 * @param value 値
 * @param options オプション
 */
export function createRule(
  param: string,
  condition: ParameterRule['condition'],
  value: any,
  options: Partial<Omit<ParameterRule, 'param' | 'condition' | 'value'>> = {}
): ParameterRule {
  return {
    param,
    condition,
    value,
    ...options,
  };
}

/**
 * よく使用されるルールのファクトリ関数
 */
export const RuleFactory = {
  /**
   * 金額が特定の値を超えるとセキュリティレベルを上げるルール
   */
  amountGreaterThan: (
    threshold: number,
    securityLevel: SecurityLevel = SecurityLevel.HIGH,
    message?: string
  ): ParameterRule => {
    return createRule('amount', 'greaterThan', threshold, {
      securityLevel,
      message: message || `Amount exceeds ${threshold}`,
    });
  },

  /**
   * 特定のドメインに対してセキュリティレベルを上げるルール
   */
  domainContains: (
    domain: string,
    securityLevel: SecurityLevel = SecurityLevel.HIGH,
    message?: string
  ): ParameterRule => {
    return createRule('domain', 'contains', domain, {
      securityLevel,
      message: message || `Domain contains ${domain}`,
    });
  },

  /**
   * 特定のパターンにマッチするとセキュリティレベルを上げるルール
   */
  patternMatches: (
    param: string,
    pattern: string,
    securityLevel: SecurityLevel = SecurityLevel.HIGH,
    message?: string
  ): ParameterRule => {
    return createRule(param, 'regex', pattern, {
      securityLevel,
      message: message || `Parameter ${param} matches pattern ${pattern}`,
    });
  },

  /**
   * 配列パラメータの長さが特定の値を超えるとセキュリティレベルを上げるルール
   */
  arrayLengthGreaterThan: (
    param: string,
    threshold: number,
    securityLevel: SecurityLevel = SecurityLevel.HIGH,
    message?: string
  ): ParameterRule => {
    return {
      param,
      condition: 'greaterThan',
      value: threshold,
      securityLevel,
      message: message || `${param} contains more than ${threshold} items`,
    };
  },
};

/**
 * 複数のルールを組み合わせるユーティリティ
 */
export function combineRules(rules: ParameterRule[][]): ParameterRule[] {
  return rules.flat();
}

/**
 * ルールをバリデーションする
 * @param rule ルール
 */
export function validateRule(rule: ParameterRule): boolean {
  if (!rule.param || typeof rule.param !== 'string') {
    console.error('Rule validation failed: param must be a non-empty string');
    return false;
  }

  if (!rule.condition || typeof rule.condition !== 'string') {
    console.error('Rule validation failed: condition must be a non-empty string');
    return false;
  }

  if (rule.value === undefined) {
    console.error('Rule validation failed: value is required');
    return false;
  }

  // 正規表現パターンの検証
  if (rule.condition === 'regex') {
    try {
      new RegExp(rule.value);
    } catch (e) {
      console.error(`Rule validation failed: invalid regex pattern: ${rule.value}`);
      return false;
    }
  }

  return true;
}