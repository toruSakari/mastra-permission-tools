import { SecurityLevel } from "./security";

// ツール実行の結果型を定義
export interface ToolExecuteResult {
	[key: string]: unknown;
	error?: string;
	status?: string;
	message?: string;
}

// beforeExecutionの戻り値の型を定義
export interface BeforeExecutionResult {
	continue: boolean;
	response?: ToolExecuteResult;
}

export interface ProxyHooks {
	beforeExecution: (
		toolName: string,
		params: Record<string, unknown>,
		context: Record<string, unknown>,
	) => Promise<BeforeExecutionResult>;

	afterExecution: (
		toolName: string,
		result: ToolExecuteResult,
		context: Record<string, unknown>,
	) => Promise<ToolExecuteResult>;

	onError: (
		toolName: string,
		error: Error,
		context: Record<string, unknown>,
	) => Promise<ToolExecuteResult>;
}

export interface PermissionResponse extends ToolExecuteResult {
	status: "permission_required" | "success" | "error" | "denied";
	toolName: string;
	message?: string;
	parameters?: Record<string, unknown>;
	result?: unknown;
	error?: string;
	securityLevel?: SecurityLevel;
	reason?: string;
	policy?: {
		expiry?: string;
		requireConfirmation?: boolean;
	};
}
