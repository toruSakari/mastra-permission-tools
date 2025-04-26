import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePermissionDialog } from './use-permission-dialog';
import { SecurityLevel } from '../../../src/types/security';

describe('usePermissionDialog', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => usePermissionDialog());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should open dialog and return promise when requestPermission called', async () => {
    const { result } = renderHook(() => usePermissionDialog());
    
    let promise: Promise<boolean>;
    
    act(() => {
      promise = result.current.requestPermission(
        'TestTool',
        'Test reason',
        SecurityLevel.HIGH
      );
    });
    
    expect(result.current.isOpen).toBe(true);
    expect(result.current.toolName).toBe('TestTool');
    expect(result.current.reason).toBe('Test reason');
    expect(result.current.securityLevel).toBe(SecurityLevel.HIGH);
  });

  it('should resolve with true when approved', async () => {
    const { result } = renderHook(() => usePermissionDialog());
    
    let promise: Promise<boolean>;
    
    act(() => {
      promise = result.current.requestPermission(
        'TestTool',
        'Test reason',
        SecurityLevel.HIGH
      );
    });
    
    act(() => {
      result.current.onApprove();
    });
    
    const approved = await promise!;
    expect(approved).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('should resolve with false when denied', async () => {
    const { result } = renderHook(() => usePermissionDialog());
    
    let promise: Promise<boolean>;
    
    act(() => {
      promise = result.current.requestPermission(
        'TestTool',
        'Test reason',
        SecurityLevel.HIGH
      );
    });
    
    act(() => {
      result.current.onDeny();
    });
    
    const approved = await promise!;
    expect(approved).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });
});