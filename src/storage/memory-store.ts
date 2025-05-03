import { IPermissionStore, PermissionInfo } from "./interfaces";

/**
 * メモリ内で許可を管理する基本的なストア実装
 */
export class MemoryPermissionStore implements IPermissionStore {
	private store: Map<string, PermissionInfo> = new Map();

	/**
	 * 許可情報を取得する
	 * @param key 許可のキー
	 */
	async getPermission(key: string): Promise<PermissionInfo | null> {
		const permission = this.store.get(key);

		if (!permission) {
			return null;
		}

		// 期限切れチェック
		if (permission.expiresAt && permission.expiresAt < Date.now()) {
			this.store.delete(key);
			return null;
		}

		return permission;
	}

	/**
	 * 許可情報を設定する
	 * @param key 許可のキー
	 * @param granted 許可されたかどうか
	 * @param expiresIn 有効期限
	 * @param metadata 追加のメタデータ
	 */
	async setPermission(
		key: string,
		granted: boolean,
		expiresIn?: string,
		metadata?: Record<string, any>,
	): Promise<void> {
		const now = Date.now();
		let expiresAt: number | undefined = undefined;

		if (expiresIn) {
			expiresAt = this.calculateExpiresAt(expiresIn, now);

			// 'once'の場合は保存しない
			if (expiresIn === "once") {
				return;
			}
		}

		this.store.set(key, {
			granted,
			expiresAt,
			grantedAt: now,
			metadata,
		});
	}

	/**
	 * 許可情報を削除する
	 * @param key 許可のキー
	 */
	async removePermission(key: string): Promise<void> {
		this.store.delete(key);
	}

	/**
	 * 期限切れの許可を削除する
	 */
	async clearExpiredPermissions(): Promise<void> {
		const now = Date.now();

		for (const [key, permission] of this.store.entries()) {
			if (permission.expiresAt && permission.expiresAt < now) {
				this.store.delete(key);
			}
		}
	}

	/**
	 * 有効期限の文字列から実際の期限を計算する
	 * @param expiresIn 有効期限の文字列
	 * @param now 現在時刻
	 */
	private calculateExpiresAt(
		expiresIn: string,
		now: number,
	): number | undefined {
		switch (expiresIn) {
			case "once":
				return undefined; // 'once'は保存しない
			case "session":
				// セッションは24時間として扱う
				return now + 24 * 60 * 60 * 1000;
			case "1h":
				return now + 60 * 60 * 1000;
			case "24h":
				return now + 24 * 60 * 60 * 1000;
			case "7d":
				return now + 7 * 24 * 60 * 60 * 1000;
			default:
				// カスタム期間（例: "30m", "2h", "3d"）
				const match = expiresIn.match(/^(\d+)([mhd])$/);
				if (match) {
					const [, value, unit] = match;
					const numValue = parseInt(value, 10);

					switch (unit) {
						case "m": // 分
							return now + numValue * 60 * 1000;
						case "h": // 時間
							return now + numValue * 60 * 60 * 1000;
						case "d": // 日
							return now + numValue * 24 * 60 * 60 * 1000;
					}
				}

				// パースできない場合はundefinedを返す
				return undefined;
		}
	}
}

/**
 * 定期的に期限切れの許可をクリーンアップするユーティリティ
 * @param store 許可ストア
 * @param intervalMs クリーンアップ間隔（ミリ秒）
 */
export function startPermissionCleanup(
	store: IPermissionStore,
	intervalMs: number = 60 * 60 * 1000, // デフォルト: 1時間
): () => void {
	const intervalId = setInterval(() => {
		store.clearExpiredPermissions().catch((error) => {
			console.error("Failed to clear expired permissions:", error);
		});
	}, intervalMs);

	// クリーンアップ停止用の関数を返す
	return () => {
		clearInterval(intervalId);
	};
}
