import { ParameterRule } from "./rules";

export enum SecurityLevel {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface ToolMetadata {
  securityLevel?: SecurityLevel;
  category?: string;
  requiresUserData?: boolean;
  requiresExternalAPI?: boolean;
  description?: string;
  permissionMessage?: string;
}

export interface SecurityPolicy {
  tools: Record<string, ToolMetadata>;
  categories: Record<string, { securityLevel: SecurityLevel }>;
  defaults: Partial<Record<SecurityLevel, {
    requirePermission: boolean;
    expiry?: string;
    requireConfirmation?: boolean;
  }>>;
  parameterRules?: Record<string, ParameterRule[]>;
}