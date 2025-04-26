import { SecurityLevel } from './security';

export interface ProxyHooks {
  beforeExecution: (
    toolName: string,
    params: any,
    context: any
  ) => Promise<{ continue: boolean; response?: any }>;
  
  afterExecution: (
    toolName: string,
    result: any,
    context: any
  ) => Promise<any>;
  
  onError: (
    toolName: string,
    error: Error,
    context: any
  ) => Promise<any>;
}

export interface PermissionResponse {
  status: 'permission_required' | 'success' | 'error' | 'denied';
  toolName: string;
  message?: string;
  parameters?: any;
  result?: any;
  error?: string;
  securityLevel?: SecurityLevel;
  reason?: string;
  policy?: {
    expiry?: string;
    requireConfirmation?: boolean;
  };
}