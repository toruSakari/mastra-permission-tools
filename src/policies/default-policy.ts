import { SecurityPolicy, SecurityLevel } from '../types/security';
import { CommonParameterRules } from '../rules/parameter-rules';

/**
 * デフォルトのセキュリティポリシー
 */
export const defaultSecurityPolicy = {
  tools: {},
  categories: {
    'internal': { securityLevel: SecurityLevel.NONE },
    'read': { securityLevel: SecurityLevel.LOW },
    'write': { securityLevel: SecurityLevel.MEDIUM },
    'external': { securityLevel: SecurityLevel.MEDIUM },
    'financial': { securityLevel: SecurityLevel.HIGH },
    'admin': { securityLevel: SecurityLevel.CRITICAL },
  },
  defaults: {
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
  } ,
  parameterRules: {},
} satisfies SecurityPolicy;
/**
 * 開発環境用のセキュリティポリシー
 */
export const developmentSecurityPolicy = {
  ...defaultSecurityPolicy,
  defaults: {
    ...defaultSecurityPolicy.defaults,
    [SecurityLevel.HIGH]: {
      requirePermission: true,
      expiry: '24h', // 開発中は長めの有効期限
    },
    [SecurityLevel.CRITICAL]: {
      requirePermission: true,
      expiry: '1h', // 開発中はCRITICALでも1時間有効
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
    [SecurityLevel.NONE]: {
      requirePermission: false,
    },
    [SecurityLevel.LOW]: {
      requirePermission: true,
      expiry: '1h',
    },
    [SecurityLevel.MEDIUM]: {
      requirePermission: true,
      expiry: '30m',
    },
    [SecurityLevel.HIGH]: {
      requirePermission: true,
      expiry: 'once',
      requireConfirmation: true,
    },
    [SecurityLevel.CRITICAL]: {
      requirePermission: true,
      expiry: 'once',
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
  customizations: Partial<SecurityPolicy>
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
    tools: {
      'QueryDatabase': {
        securityLevel: SecurityLevel.MEDIUM,
        category: 'data',
        permissionMessage: 'Database access required for data retrieval',
      },
      'UpdateDatabase': {
        securityLevel: SecurityLevel.HIGH,
        category: 'data',
        permissionMessage: 'Database modification requires approval',
      },
    },
    parameterRules: {
      'QueryDatabase': [CommonParameterRules.dataAccess.sensitiveFields],
      'UpdateDatabase': [CommonParameterRules.dataAccess.bulkAccess],
    },
  },
  
  fileOperations: {
    tools: {
      'ReadFile': {
        securityLevel: SecurityLevel.LOW,
        category: 'read',
        permissionMessage: 'File read access required',
      },
      'WriteFile': {
        securityLevel: SecurityLevel.MEDIUM,
        category: 'write',
        permissionMessage: 'File write access required',
      },
      'DeleteFile': {
        securityLevel: SecurityLevel.HIGH,
        category: 'write',
        permissionMessage: 'File deletion requires approval',
      },
    },
    parameterRules: {
      'WriteFile': [CommonParameterRules.fileOperation.largeFile],
      'DeleteFile': [CommonParameterRules.fileOperation.systemFiles],
    },
  },
  
  apiOperations: {
    tools: {
      'FetchAPI': {
        securityLevel: SecurityLevel.LOW,
        category: 'external',
        permissionMessage: 'External API call requires permission',
      },
      'PostAPI': {
        securityLevel: SecurityLevel.MEDIUM,
        category: 'external',
        permissionMessage: 'External API modification requires approval',
      },
    },
    parameterRules: {
      'FetchAPI': [CommonParameterRules.externalApi.untrustedDomain],
      'PostAPI': [
        CommonParameterRules.externalApi.untrustedDomain,
        CommonParameterRules.externalApi.highFrequency,
      ],
    },
  },
};