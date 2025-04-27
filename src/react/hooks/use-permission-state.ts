import { useState, useCallback } from "react";
import { IPermissionStore, MemoryPermissionStore } from "../../core/store";

interface UsePermissionStateOptions {
	store?: IPermissionStore;
	userId?: string;
	defaultPermissions?: Record<string, boolean>;
}

export function usePermissionState(options: UsePermissionStateOptions = {}) {
	const {
		store = new MemoryPermissionStore(),
		userId = "anonymous",
		defaultPermissions = {},
	} = options;

	const [permissions, setPermissions] =
		useState<Record<string, boolean>>(defaultPermissions);
	const [loading, setLoading] = useState<Record<string, boolean>>({});

	// 許可状態を取得
	const checkPermission = useCallback(
		async (toolName: string): Promise<boolean> => {
			setLoading((prev) => ({ ...prev, [toolName]: true }));

			try {
				const key = `${userId}:${toolName}`;
				const result = await store.getPermission(key);
				const isGranted = result?.granted ?? false;

				setPermissions((prev) => ({ ...prev, [toolName]: isGranted }));
				return isGranted;
			} catch (error) {
				console.error("Failed to check permission:", error);
				return false;
			} finally {
				setLoading((prev) => ({ ...prev, [toolName]: false }));
			}
		},
		[store, userId],
	);

	// 許可を設定
	const setPermission = useCallback(
		async (
			toolName: string,
			granted: boolean,
			expiry?: string,
		): Promise<void> => {
			try {
				const key = `${userId}:${toolName}`;
				await store.setPermission(key, granted, expiry);
				setPermissions((prev) => ({ ...prev, [toolName]: granted }));
			} catch (error) {
				console.error("Failed to set permission:", error);
			}
		},
		[store, userId],
	);

	// 許可をクリア
	const clearPermission = useCallback(
		async (toolName: string): Promise<void> => {
			try {
				const key = `${userId}:${toolName}`;
				await store.removePermission(key);
				setPermissions((prev) => {
					const newPermissions = { ...prev };
					delete newPermissions[toolName];
					return newPermissions;
				});
			} catch (error) {
				console.error("Failed to clear permission:", error);
			}
		},
		[store, userId],
	);

	// すべての許可をクリア
	const clearAllPermissions = useCallback(async (): Promise<void> => {
		try {
			await store.clearExpiredPermissions();
			setPermissions({});
		} catch (error) {
			console.error("Failed to clear all permissions:", error);
		}
	}, [store]);

	return {
		permissions,
		loading,
		checkPermission,
		setPermission,
		clearPermission,
		clearAllPermissions,
	};
}
