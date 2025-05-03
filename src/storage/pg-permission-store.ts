import { Pool, PoolConfig } from "pg";
import { IPermissionStore, PermissionInfo } from "./interfaces";

export interface PgPermissionStoreConfig {
	/**
	 * PostgreSQL接続設定
	 */
	pgConfig: PoolConfig;

	/**
	 * 許可情報を保存するテーブル名
	 * @default 'permission_store'
	 */
	tableName?: string;

	/**
	 * 自動的にテーブルを作成するかどうか
	 * @default true
	 */
	autoCreateTable?: boolean;
}

/**
 * PostgreSQLを使用した許可ストア実装
 */
export class PgPermissionStore implements IPermissionStore {
	private pool: Pool;
	private tableName: string;
	private autoCreateTable: boolean;
	private initialized: boolean = false;

	constructor(config: PgPermissionStoreConfig) {
		this.pool = new Pool(config.pgConfig);
		this.tableName = config.tableName || "permission_store";
		this.autoCreateTable = config.autoCreateTable !== false;
	}

	/**
	 * ストアを初期化
	 */
	private async initialize(): Promise<void> {
		if (this.initialized) return;

		if (this.autoCreateTable) {
			await this.createTableIfNotExists();
		}

		this.initialized = true;
	}

	/**
	 * テーブルが存在しない場合に作成
	 */
	private async createTableIfNotExists(): Promise<void> {
		const client = await this.pool.connect();

		try {
			await client.query(`
        CREATE TABLE IF NOT EXISTS "${this.tableName}" (
          key TEXT PRIMARY KEY,
          granted BOOLEAN NOT NULL,
          expires_at BIGINT,
          granted_at BIGINT NOT NULL,
          metadata JSONB
        );
      `);
		} finally {
			client.release();
		}
	}

	/**
	 * 許可情報を取得
	 * @param key 許可のキー
	 */
	async getPermission(key: string): Promise<PermissionInfo | null> {
		await this.initialize();

		const client = await this.pool.connect();
		try {
			const query = {
				text: `SELECT granted, expires_at, granted_at, metadata FROM "${this.tableName}" WHERE key = $1`,
				values: [key],
			};

			const result = await client.query(query);

			if (result.rows.length === 0) {
				return null;
			}

			const row = result.rows[0];

			// 期限切れチェック
			if (row.expires_at && row.expires_at < Date.now()) {
				// 期限切れの場合は削除して null を返す
				await this.removePermission(key);
				return null;
			}

			return {
				granted: row.granted,
				expiresAt: row.expires_at || undefined,
				grantedAt: row.granted_at,
				metadata: row.metadata || undefined,
			};
		} finally {
			client.release();
		}
	}

	/**
	 * 許可情報を設定
	 * @param key 許可のキー
	 * @param granted 許可されたかどうか
	 * @param expiresIn 有効期限
	 * @param metadata メタデータ
	 */
	async setPermission(
		key: string,
		granted: boolean,
		expiresIn?: string,
		metadata?: Record<string, any>,
	): Promise<void> {
		await this.initialize();

		// once の場合は保存しない
		if (expiresIn === "once") {
			return;
		}

		const now = Date.now();
		let expiresAt: number | null = null;

		if (expiresIn) {
			// 有効期限の計算
			switch (expiresIn) {
				case "session":
					// セッションは24時間として扱う
					expiresAt = now + 24 * 60 * 60 * 1000;
					break;
				case "1h":
					expiresAt = now + 60 * 60 * 1000;
					break;
				case "24h":
					expiresAt = now + 24 * 60 * 60 * 1000;
					break;
				case "7d":
					expiresAt = now + 7 * 24 * 60 * 60 * 1000;
					break;
				default:
					// カスタム期間（例: "30m", "2h", "3d"）
					const match = expiresIn.match(/^(\d+)([mhd])$/);
					if (match) {
						const [, value, unit] = match;
						const numValue = parseInt(value, 10);

						switch (unit) {
							case "m": // 分
								expiresAt = now + numValue * 60 * 1000;
								break;
							case "h": // 時間
								expiresAt = now + numValue * 60 * 60 * 1000;
								break;
							case "d": // 日
								expiresAt = now + numValue * 24 * 60 * 60 * 1000;
								break;
						}
					}
			}
		}

		const client = await this.pool.connect();
		try {
			const query = {
				text: `
          INSERT INTO "${this.tableName}" (key, granted, expires_at, granted_at, metadata)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (key) DO UPDATE SET
            granted = $2,
            expires_at = $3,
            granted_at = $4,
            metadata = $5
        `,
				values: [
					key,
					granted,
					expiresAt,
					now,
					metadata ? JSON.stringify(metadata) : null,
				],
			};

			await client.query(query);
		} finally {
			client.release();
		}
	}

	/**
	 * 許可情報を削除
	 * @param key 許可のキー
	 */
	async removePermission(key: string): Promise<void> {
		await this.initialize();

		const client = await this.pool.connect();
		try {
			const query = {
				text: `DELETE FROM "${this.tableName}" WHERE key = $1`,
				values: [key],
			};

			await client.query(query);
		} finally {
			client.release();
		}
	}

	/**
	 * 期限切れの許可を削除
	 */
	async clearExpiredPermissions(): Promise<void> {
		await this.initialize();

		const client = await this.pool.connect();
		try {
			const now = Date.now();
			const query = {
				text: `DELETE FROM "${this.tableName}" WHERE expires_at IS NOT NULL AND expires_at < $1`,
				values: [now],
			};

			await client.query(query);
		} finally {
			client.release();
		}
	}

	/**
	 * コネクションプールを終了
	 */
	async close(): Promise<void> {
		await this.pool.end();
	}
}
