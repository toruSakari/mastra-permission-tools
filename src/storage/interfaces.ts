/**
 * 許可情報のインターフェース
 */
export interface PermissionInfo {
	granted: boolean;
	expiresAt?: number;
	grantedAt: number;
	metadata?: Record<string, any>;
}

/**
 * 許可ストアのインターフェース
 */
export interface IPermissionStore {
	getPermission(key: string): Promise<PermissionInfo | null>;
	setPermission(
		key: string,
		granted: boolean,
		expiresIn?: string,
		metadata?: Record<string, any>,
	): Promise<void>;
	removePermission(key: string): Promise<void>;
	clearExpiredPermissions(): Promise<void>;
}

/**
 * 許可キーを生成するユーティリティ関数
 * @param userId ユーザーID
 * @param toolName ツール名
 * @param params オプションのパラメータ
 */
export function generatePermissionKey(
	userId: string,
	toolName: string,
	params?: Record<string, any>,
): string {
	let key = `${userId}:${toolName}`;

	// パラメータがある場合はハッシュ化して追加
	if (params && Object.keys(params).length > 0) {
		const paramsHash = hashParams(params);
		key += `:${paramsHash}`;
	}

	return key;
}

/**
 * パラメータをハッシュ化する
 * @param params パラメータ
 */
function hashParams(params: Record<string, any>): string {
	// シンプルな実装：JSONを文字列化してシンプルなハッシュを生成
	const jsonString = JSON.stringify(params, Object.keys(params).sort());

	let hash = 0;
	for (let i = 0; i < jsonString.length; i++) {
		const char = jsonString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}

	return Math.abs(hash).toString(16);
}
