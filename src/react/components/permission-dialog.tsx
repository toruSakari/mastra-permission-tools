import React from "react";
import { SecurityLevel } from "../../types/security";
import {
	getSecurityLevelColor,
	getSecurityLevelDisplayName,
} from "../../core/security-levels";

export interface PermissionDialogProps {
	isOpen: boolean;
	toolName: string;
	reason: string;
	securityLevel: SecurityLevel;
	parameters?: Record<string, any>;
	policy?: {
		expiry?: string;
		requireConfirmation?: boolean;
	};
	onApprove: () => void;
	onDeny: () => void;
	onClose?: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
	isOpen,
	toolName,
	reason,
	securityLevel,
	parameters,
	policy,
	onApprove,
	onDeny,
	onClose,
}) => {
	if (!isOpen) return null;

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget && onClose) {
			onClose();
		}
	};

	const securityColor = getSecurityLevelColor(securityLevel);
	const displayName = getSecurityLevelDisplayName(securityLevel);

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
			onClick={handleOverlayClick}
		>
			<div
				style={{
					backgroundColor: "white",
					borderRadius: "8px",
					boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
					maxWidth: "500px",
					width: "90%",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						backgroundColor: securityColor,
						color: "white",
						padding: "16px 24px",
						borderBottom: `4px solid ${securityColor}`,
					}}
				>
					<h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
						Permission Required
					</h3>
					<p style={{ margin: "4px 0 0", fontSize: "14px", opacity: 0.9 }}>
						Security Level: {displayName}
					</p>
				</div>

				<div style={{ padding: "24px" }}>
					<h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600 }}>
						{toolName}
					</h4>
					<p style={{ margin: "0 0 16px", color: "#4b5563" }}>{reason}</p>

					{parameters && Object.keys(parameters).length > 0 && (
						<div
							style={{
								backgroundColor: "#f3f4f6",
								borderRadius: "4px",
								padding: "12px",
								marginBottom: "16px",
							}}
						>
							<h5
								style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}
							>
								Parameters:
							</h5>
							<pre
								style={{ margin: 0, fontSize: "12px", whiteSpace: "pre-wrap" }}
							>
								{JSON.stringify(parameters, null, 2)}
							</pre>
						</div>
					)}

					{policy && (
						<div
							style={{
								marginBottom: "16px",
								fontSize: "14px",
								color: "#6b7280",
							}}
						>
							{policy.expiry && (
								<p style={{ margin: "0 0 4px" }}>
									This permission will expire: {policy.expiry}
								</p>
							)}
							{policy.requireConfirmation && (
								<p style={{ margin: 0, color: "#dc2626" }}>
									⚠️ This action requires explicit confirmation
								</p>
							)}
						</div>
					)}
				</div>

				<div
					style={{
						padding: "16px 24px",
						backgroundColor: "#f9fafb",
						borderTop: "1px solid #e5e7eb",
						display: "flex",
						justifyContent: "flex-end",
						gap: "12px",
					}}
				>
					<button
						onClick={onDeny}
						style={{
							padding: "8px 16px",
							border: "1px solid #d1d5db",
							borderRadius: "6px",
							backgroundColor: "white",
							cursor: "pointer",
							fontSize: "14px",
							fontWeight: 500,
							color: "#374151",
						}}
					>
						Deny
					</button>
					<button
						onClick={onApprove}
						style={{
							padding: "8px 16px",
							border: "none",
							borderRadius: "6px",
							backgroundColor: securityColor,
							color: "white",
							cursor: "pointer",
							fontSize: "14px",
							fontWeight: 500,
						}}
					>
						Approve
					</button>
				</div>
			</div>
		</div>
	);
};
