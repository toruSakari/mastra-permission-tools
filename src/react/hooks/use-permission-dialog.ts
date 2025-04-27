import { useState, useCallback } from "react";
import { SecurityLevel } from "../../types/security";

interface PermissionDialogState {
	isOpen: boolean;
	toolName: string;
	reason: string;
	securityLevel: SecurityLevel;
	parameters?: Record<string, any>;
	policy?: {
		expiry?: string;
		requireConfirmation?: boolean;
	};
	resolve: ((value: boolean) => void) | null;
}

const initialState: PermissionDialogState = {
	isOpen: false,
	toolName: "",
	reason: "",
	securityLevel: SecurityLevel.MEDIUM,
	parameters: undefined,
	policy: undefined,
	resolve: null,
};

export function usePermissionDialog() {
	const [dialogState, setDialogState] =
		useState<PermissionDialogState>(initialState);

	const requestPermission = useCallback(
		(
			toolName: string,
			reason: string,
			securityLevel: SecurityLevel,
			parameters?: Record<string, any>,
			policy?: { expiry?: string; requireConfirmation?: boolean },
		): Promise<boolean> => {
			return new Promise((resolve) => {
				setDialogState({
					isOpen: true,
					toolName,
					reason,
					securityLevel,
					parameters,
					policy,
					resolve,
				});
			});
		},
		[],
	);

	const handleApprove = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve(true);
		}
		setDialogState(initialState);
	}, [dialogState.resolve]);

	const handleDeny = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve(false);
		}
		setDialogState(initialState);
	}, [dialogState.resolve]);

	const handleClose = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve(false);
		}
		setDialogState(initialState);
	}, [dialogState.resolve]);

	return {
		isOpen: dialogState.isOpen,
		toolName: dialogState.toolName,
		reason: dialogState.reason,
		securityLevel: dialogState.securityLevel,
		parameters: dialogState.parameters,
		policy: dialogState.policy,
		requestPermission,
		onApprove: handleApprove,
		onDeny: handleDeny,
		onClose: handleClose,
	};
}
