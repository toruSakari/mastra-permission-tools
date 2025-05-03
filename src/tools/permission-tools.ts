import { createTool } from "@mastra/core";
import { z } from "zod";
import {
	handlePermissionResponse,
	PermissionHooksOptions,
} from "../core/hooks";
import type { SecurityPolicy } from "../types/security";

/**
 * 許可応答ツールを作成する
 * @param securityPolicy セキュリティポリシー
 * @param options フックオプション
 */
export function createPermissionResponseTool(
	securityPolicy: SecurityPolicy,
	options: Omit<PermissionHooksOptions, "getIdentifier"> = {},
) {
	return createTool({
		id: "Respond To Permission",
		inputSchema: z.object({
			toolName: z.string().describe("許可を求めているツールの名前"),
			parameters: z.record(z.any()).describe("ツールに渡すパラメータ"),
			user_approved: z.boolean().describe("許可されたかどうか"),
		}),
		description: "ユーザーからの許可応答を処理します",
		execute: async (param) => {
			const { toolName, parameters, user_approved: approved } = param.context;

			// 実行コンテキストを作成
			const executionContext = {
				...(param.resourceId && { resourceId: param.resourceId }),
				...(param.threadId && { threadId: param.threadId }),
			};

			// 許可応答を処理
			return await handlePermissionResponse(
				toolName,
				parameters,
				approved,
				executionContext,
				securityPolicy,
				{
					...options,
					getIdentifier: (ctx) => ctx.resourceId || "anonymous",
				},
			);
		},
	});
}

/**
 * 許可状態を確認するツール（オプション）
 */
export function createCheckPermissionTool(
	options: Omit<PermissionHooksOptions, "getIdentifier"> = {},
) {
	return createTool({
		id: "Check Permission Status",
		inputSchema: z.object({
			toolName: z.string().describe("確認するツールの名前"),
		}),
		description: "特定のツールの許可状態を確認します",
		execute: async ({ context, resourceId }) => {
			const { toolName } = context;
			const { store } = options;

			if (!store) {
				return {
					status: "error",
					toolName,
					message: "Permission store is not configured",
				};
			}

			const identifier = resourceId || "anonymous";
			const permissionKey = `${identifier}:${toolName}`;

			try {
				const permissionInfo = await store.getPermission(permissionKey);

				if (!permissionInfo) {
					return {
						status: "not_found",
						toolName,
						permissionStatus: "unknown",
						message: `No permission record found for ${toolName}`,
					};
				}

				return {
					status: "success",
					toolName,
					permissionStatus: permissionInfo.granted ? "granted" : "denied",
					grantedAt: permissionInfo.grantedAt,
					expiresAt: permissionInfo.expiresAt,
					message: `Permission status for ${toolName}: ${permissionInfo.granted ? "granted" : "denied"}`,
				};
			} catch (error) {
				return {
					status: "error",
					toolName,
					error: error instanceof Error ? error.message : "Unknown error",
					message: `Failed to check permission status: ${error instanceof Error ? error.message : "Unknown error"}`,
				};
			}
		},
	});
}

/**
 * 許可をクリアするツール（オプション）
 */
export function createClearPermissionTool(
	options: Omit<PermissionHooksOptions, "getIdentifier"> = {},
) {
	return createTool({
		id: "Clear Permission",
		inputSchema: z.object({
			toolName: z.string().describe("許可をクリアするツールの名前"),
		}),
		description: "特定のツールの許可をクリアします",
		execute: async ({ context, resourceId }) => {
			const { toolName } = context;
			const { store } = options;

			if (!store) {
				return {
					status: "error",
					toolName,
					message: "Permission store is not configured",
				};
			}

			const identifier = resourceId || "anonymous";
			const permissionKey = `${identifier}:${toolName}`;

			try {
				await store.removePermission(permissionKey);

				return {
					status: "success",
					toolName,
					message: `Permission cleared for ${toolName}`,
				};
			} catch (error) {
				return {
					status: "error",
					toolName,
					error: error instanceof Error ? error.message : "Unknown error",
					message: `Failed to clear permission: ${error instanceof Error ? error.message : "Unknown error"}`,
				};
			}
		},
	});
}

/**
 * すべての許可応答関連ツールを作成するヘルパー関数
 */
export function createPermissionTools(
	securityPolicy: SecurityPolicy,
	options: Omit<PermissionHooksOptions, "getIdentifier"> = {},
) {
	return {
		respondToPermission: createPermissionResponseTool(securityPolicy, options),
		checkPermissionStatus: createCheckPermissionTool(options),
		clearPermission: createClearPermissionTool(options),
	};
}
