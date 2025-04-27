import { ProxyHooks, PermissionResponse } from '../types/proxy';
import { SecurityPolicy, SecurityLevel } from '../types/security';
import { IPermissionStore, generatePermissionKey } from './store';
import {  
  compareSecurityLevels,
  DEFAULT_SECURITY_LEVELS 
} from './security-levels';
import { evaluateParameterRules } from '../rules/rule-evaluator';

export interface PermissionHooksOptions {
  store?: IPermissionStore;
  onPermissionRequest?: (toolName: string, params: any, userId: string) => void;
  onPermissionGranted?: (toolName: string, userId: string) => void;
  onPermissionDenied?: (toolName: string, userId: string) => void;
  defaultUserId?: string;
}

/**
 * 許可確認フックを作成する
 * @param securityPolicy セキュリティポリシー
 * @param options オプション
 */
export function createPermissionHooks(
  securityPolicy: SecurityPolicy,
  options: PermissionHooksOptions = {}
): ProxyHooks {
  const {
    store,
    onPermissionRequest,
    onPermissionGranted,
    defaultUserId = 'anonymous',
  } = options;

  return {
    beforeExecution: async (toolName, params, context) => {
      // ユーザーIDの取得
      const userId = context.userId || defaultUserId;

      // ツールのメタデータを取得
      const metadata = securityPolicy.tools[toolName] || {};
      
      // セキュリティレベルの決定
      let securityLevel = determineSecurityLevel(
        toolName,
        metadata,
        params,
        securityPolicy
      );

      // セキュリティポリシーの取得
      const policy = securityPolicy.defaults[securityLevel] || 
                    DEFAULT_SECURITY_LEVELS[securityLevel];
      
      // 許可が必要かどうか判断
      if (!policy.requirePermission) {
        return { continue: true };
      }

      // 既存の許可をチェック
      if (store) {
        const permissionKey = generatePermissionKey(userId, toolName, params);
        const existingPermission = await store.getPermission(permissionKey);
        
        if (existingPermission && existingPermission.granted) {
          return { continue: true };
        }
      }

      // 許可リクエストのコールバック
      if (onPermissionRequest) {
        onPermissionRequest(toolName, params, userId);
      }

      // 許可を求める必要がある場合
      return {
        continue: false,
        response: createPermissionResponse(
          toolName,
          params,
          securityLevel,
          metadata,
          policy
        ),
      };
    },

    afterExecution: async (toolName, result, context) => {
      // 実行後の処理
      const userId = context.userId || defaultUserId;
      
      // 許可が付与されたことをコールバックで通知
      if (onPermissionGranted) {
        onPermissionGranted(toolName, userId);
      }

      return result;
    },

    onError: async (toolName, error) => {
      // エラー処理
      console.error(`Tool execution error for ${toolName}:`, error);
      
      return {
        status: 'error',
        toolName,
        error: error.message,
        message: `${toolName}の実行中にエラーが発生しました: ${error.message}`,
      };
    },
  };
}

/**
 * セキュリティレベルを決定する
 */
function determineSecurityLevel(
  toolName: string,
  metadata: Record<string, any>,
  params: any,
  securityPolicy: SecurityPolicy
): SecurityLevel {
  let securityLevel = metadata.securityLevel;

  // メタデータにレベルがない場合はカテゴリから判断
  if (!securityLevel && metadata.category) {
    const categoryPolicy = securityPolicy.categories[metadata.category];
    securityLevel = categoryPolicy?.securityLevel;
  }

  // パラメータルールに基づく評価
  if (securityPolicy.parameterRules) {
    const paramEvaluation = evaluateParameterRules(
      toolName,
      params,
      securityPolicy.parameterRules
    );

    if (paramEvaluation.securityLevel) {
      // パラメータルールによるレベルが高い場合は上書き
      if (compareSecurityLevels(paramEvaluation.securityLevel, securityLevel) > 0) {
        securityLevel = paramEvaluation.securityLevel;
      }
    }
  }

  // デフォルトはMEDIUM
  return securityLevel || SecurityLevel.MEDIUM;
}

/**
 * 許可応答を作成する
 */
function createPermissionResponse(
  toolName: string,
  parameters: any,
  securityLevel: SecurityLevel,
  metadata: Record<string, any>,
  policy: Record<string, any>
): PermissionResponse {
  return {
    status: 'permission_required',
    toolName,
    parameters,
    securityLevel,
    reason: metadata.permissionMessage || 
          `${toolName}ツールの実行には許可が必要です`,
    policy: {
      expiry: policy.expiry,
      requireConfirmation: policy.requireConfirmation,
    },
  };
}

/**
 * 許可応答を処理する
 */
export async function handlePermissionResponse(
  toolName: string,
  parameters: any,
  approved: boolean,
  context: any,
  securityPolicy: SecurityPolicy,
  options: {
    store?: IPermissionStore;
    onPermissionGranted?: (toolName: string, userId: string) => void;
    onPermissionDenied?: (toolName: string, userId: string) => void;
  } = {}
): Promise<PermissionResponse> {
  const userId = context.userId || 'anonymous';
  const { store, onPermissionGranted, onPermissionDenied } = options;

  // ツールのメタデータを取得
  const metadata = securityPolicy.tools[toolName] || {};
  const securityLevel = determineSecurityLevel(
    toolName,
    metadata,
    parameters,
    securityPolicy
  );
  
  const policy = securityPolicy.defaults[securityLevel] || 
                DEFAULT_SECURITY_LEVELS[securityLevel];

  if (approved) {
    // 許可が得られた場合、許可状態を保存
    if (store) {
      const permissionKey = generatePermissionKey(userId, toolName, parameters);
      await store.setPermission(
        permissionKey,
        true,
        policy.expiry,
        { approvedAt: Date.now() }
      );
    }

    // コールバック通知
    if (onPermissionGranted) {
      onPermissionGranted(toolName, userId);
    }

    return {
      status: 'success',
      toolName,
      message: `${toolName}ツールの実行が許可されました`,
    };
  } else {
    // 許可が拒否された場合
    if (store) {
      const permissionKey = generatePermissionKey(userId, toolName, parameters);
      await store.setPermission(
        permissionKey,
        false,
        undefined,
        { deniedAt: Date.now() }
      );
    }

    // コールバック通知
    if (onPermissionDenied) {
      onPermissionDenied(toolName, userId);
    }

    return {
      status: 'denied',
      toolName,
      message: `${toolName}ツールの実行は拒否されました`,
    };
  }
}