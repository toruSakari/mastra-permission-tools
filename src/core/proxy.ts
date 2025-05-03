import type { Tool } from "@mastra/core/dist/tools";
import { ProxyHooks } from "../types/proxy";
import { ToolExecuteResult } from "../types/proxy";

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
export function createToolExecutionProxy<T extends Record<string, Tool>>(
	originalTools: T,
	hooks: ProxyHooks,
): T {
	// 空のオブジェクトを作成し、後で同じキーを持つプロパティで埋める
	const proxiedTools = Object.fromEntries(
		Object.entries(originalTools).map(([name, tool]) => [
			name,
			createProxiedTool(name, tool, hooks),
		]),
	) as T;

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
	hooks: ProxyHooks,
): ProxiedTool {
	return {
		...tool,
		original: tool,
		proxyMetadata: {
			createdAt: Date.now(),
			proxyVersion: "1.0.0",
		},
		execute: async (context, options) => {
			try {
				// 実行前フック（context全体を渡す）
				const beforeResult = await hooks.beforeExecution(
					name,
					context.context,
					{ ...context, ...options }, // contextとoptionsを結合
				);

				if (!beforeResult.continue) {
					return (
						beforeResult.response || {
							error: `Tool execution not permitted for ${name}`,
						}
					);
				}

				if (!tool.execute) {
					throw new Error(`Tool ${name} does not have an execute method`);
				}

				const result = await tool.execute(context, options);

				return await hooks.afterExecution(name, result as ToolExecuteResult, {
					...context,
					...options,
				});
			} catch (error) {
				return await hooks.onError(name, error as Error, {
					...context,
					...options,
				});
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
	return tool && "original" in tool && "proxyMetadata" in tool;
}

/**
 * プロキシツールのメタデータを取得する
 * @param proxiedTool プロキシ化されたツール
 */
export function getProxyMetadata(proxiedTool: ProxiedTool) {
	return proxiedTool.proxyMetadata;
}

/**
 * 条件付きプロキシを作成する
 * @param condition 条件関数
 * @param hooks 条件がtrueの場合に適用するフック
 */
export function createConditionalProxy(
	condition: (toolName: string, params: any) => boolean,
	hooks: ProxyHooks,
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
	logger: (message: string, data?: any) => void,
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
			logger(`Tool execution error: ${toolName}`, {
				error: error.message,
				context,
			});
			return { error: error.message };
		},
	};
}
