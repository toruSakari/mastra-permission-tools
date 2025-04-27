import type { Tool } from '@mastra/core/dist/tools';
import { ProxyHooks } from '../types/proxy';

export type ProxiedTool = Tool & {
  original?: Tool;
  proxyMetadata?: {
    createdAt: number;
    proxyVersion: string;
  };
};

/**
 * ツール実行プロキシを作成する
 * @param originalTools 元のツール群
 * @param hooks プロキシフック
 */
export function createToolExecutionProxy(
  originalTools: Record<string, Tool>,
  hooks: ProxyHooks
): Record<string, ProxiedTool> {
  const proxiedTools: Record<string, ProxiedTool> = {};

  for (const [name, tool] of Object.entries(originalTools)) {
    proxiedTools[name] = createProxiedTool(name, tool, hooks);
  }

  return proxiedTools;
}

/**
 * 個別のツールをプロキシ化する
 * @param name ツール名
 * @param tool 元のツール
 * @param hooks プロキシフック
 */
function createProxiedTool(
  name: string,
  tool: Tool,
  hooks: ProxyHooks
): ProxiedTool {
  return {
    // 元のツールのプロパティをすべてコピー
    ...tool,
    
    // プロキシメタデータを追加
    original: tool,
    proxyMetadata: {
      createdAt: Date.now(),
      proxyVersion: '1.0.0',
    },

    // execute関数をオーバーライド
    execute: async (params) => {
      try {
        // 実行前フック
        const beforeResult = await hooks.beforeExecution(
          name,
          params.context,
          params.mastra || {}
        );

        // 続行が許可されていない場合は早期リターン
        if (!beforeResult.continue) {
          return beforeResult.response || { 
            error: `Tool execution not permitted for ${name}` 
          };
        }

        if (!tool.execute) {
          throw new Error(`Tool ${name} does not have an execute method`);
        }

        // 実際のツールを実行
        const result = await tool.execute(params);

        // 実行後フック
        return await hooks.afterExecution(
          name,
          result,
          params.mastra || {}
        );
      } catch (error) {
        // エラーフック
        return await hooks.onError(
          name,
          error as Error,
          params.mastra || {}
        );
      }
    },
  };
}

/**
 * プロキシを通じて元のツールにアクセスする
 * @param proxiedTool プロキシ化されたツール
 */
export function getOriginalTool(proxiedTool: ProxiedTool): Tool | undefined {
  return proxiedTool.original;
}

/**
 * ツールがプロキシ化されているか確認する
 * @param tool チェックするツール
 */
export function isProxiedTool(tool: any): tool is ProxiedTool {
  return tool && 'original' in tool && 'proxyMetadata' in tool;
}

/**
 * プロキシツールのメタデータを取得する
 * @param proxiedTool プロキシ化されたツール
 */
export function getProxyMetadata(proxiedTool: ProxiedTool) {
  return proxiedTool.proxyMetadata;
}

/**
 * 複数のプロキシをチェーンする
 * @param hooks1 最初のフック
 * @param hooks2 2番目のフック
 */
export function chainProxyHooks(
  hooks1: ProxyHooks,
  hooks2: ProxyHooks
): ProxyHooks {
  return {
    beforeExecution: async (toolName, params, context) => {
      const result1 = await hooks1.beforeExecution(toolName, params, context);
      if (!result1.continue) {
        return result1;
      }
      
      return await hooks2.beforeExecution(toolName, params, context);
    },

    afterExecution: async (toolName, result, context) => {
      const result1 = await hooks1.afterExecution(toolName, result, context);
      return await hooks2.afterExecution(toolName, result1, context);
    },

    onError: async (toolName, error, context) => {
      try {
        return await hooks1.onError(toolName, error, context);
      } catch (e) {
        return await hooks2.onError(toolName, e as Error, context);
      }
    },
  };
}

/**
 * 条件付きプロキシを作成する
 * @param condition 条件関数
 * @param hooks 条件がtrueの場合に適用するフック
 */
export function createConditionalProxy(
  condition: (toolName: string, params: any) => boolean,
  hooks: ProxyHooks
): ProxyHooks {
  return {
    beforeExecution: async (toolName, params, context) => {
      if (condition(toolName, params)) {
        return await hooks.beforeExecution(toolName, params, context);
      }
      return { continue: true };
    },

    afterExecution: async (toolName, result, context) => {
      if (condition(toolName, result)) {
        return await hooks.afterExecution(toolName, result, context);
      }
      return result;
    },

    onError: async (toolName, error, context) => {
      if (condition(toolName, context)) {
        return await hooks.onError(toolName, error, context);
      }
      return { error: error.message };
    },
  };
}

/**
 * デバッグ用のプロキシを作成する
 */
export function createDebugProxy(): ProxyHooks {
  return {
    beforeExecution: async (toolName, params, context) => {
      console.log(`[DEBUG] Before execution: ${toolName}`, { params, context });
      return { continue: true };
    },

    afterExecution: async (toolName, result, context) => {
      console.log(`[DEBUG] After execution: ${toolName}`, { result, context });
      return result;
    },

    onError: async (toolName, error, context) => {
      console.error(`[DEBUG] Error in ${toolName}:`, error, { context });
      return { error: error.message };
    },
  };
}

/**
 * ログ用のプロキシを作成する
 * @param logger ログ関数
 */
export function createLoggingProxy(
  logger: (message: string, data?: any) => void
): ProxyHooks {
  return {
    beforeExecution: async (toolName, params, context) => {
      logger(`Tool execution started: ${toolName}`, { params, context });
      return { continue: true };
    },

    afterExecution: async (toolName, result, context) => {
      logger(`Tool execution completed: ${toolName}`, { result, context });
      return result;
    },

    onError: async (toolName, error, context) => {
      logger(`Tool execution error: ${toolName}`, { error: error.message, context });
      return { error: error.message };
    },
  };
}