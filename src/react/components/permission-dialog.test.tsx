import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionDialog } from './permission-dialog';
import { SecurityLevel } from '../../../src/types/security';

describe('PermissionDialog', () => {
  const defaultProps = {
    isOpen: true,
    toolName: 'TestTool',
    reason: 'Test reason',
    securityLevel: SecurityLevel.MEDIUM,
    onApprove: vi.fn(),
    onDeny: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render when open', () => {
    render(<PermissionDialog {...defaultProps} />);
    
    expect(screen.getByText('Permission Required')).toBeInTheDocument();
    expect(screen.getByText('TestTool')).toBeInTheDocument();
    expect(screen.getByText('Test reason')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<PermissionDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Permission Required')).not.toBeInTheDocument();
  });

  it('should call onApprove when approve button clicked', () => {
    render(<PermissionDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Approve'));
    
    expect(defaultProps.onApprove).toHaveBeenCalled();
  });

  it('should call onDeny when deny button clicked', () => {
    render(<PermissionDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Deny'));
    
    expect(defaultProps.onDeny).toHaveBeenCalled();
  });

  it('should display parameters when provided', () => {
    const parameters = { param1: 'value1', param2: 123 };
    render(<PermissionDialog {...defaultProps} parameters={parameters} />);
    
    expect(screen.getByText('Parameters:')).toBeInTheDocument();
    expect(screen.getByText(/"param1": "value1"/)).toBeInTheDocument();
  });

  it('should display policy information when provided', () => {
    const policy = { expiry: '1h', requireConfirmation: true };
    render(<PermissionDialog {...defaultProps} policy={policy} />);
    
    expect(screen.getByText(/This permission will expire: 1h/)).toBeInTheDocument();
    expect(screen.getByText(/This action requires explicit confirmation/)).toBeInTheDocument();
  });
});