import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryPermissionStore, generatePermissionKey } from '../../src/core/store';

describe('MemoryPermissionStore', () => {
  let store: MemoryPermissionStore;

  beforeEach(() => {
    store = new MemoryPermissionStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getPermission', () => {
    it('should return null for non-existent permissions', async () => {
      const result = await store.getPermission('test:key');
      expect(result).toBeNull();
    });

    it('should return stored permission', async () => {
      await store.setPermission('test:key', true);
      const result = await store.getPermission('test:key');
      expect(result).toBeTruthy();
      expect(result?.granted).toBe(true);
    });

    it('should return null for expired permissions', async () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      await store.setPermission('test:key', true, '1h');
      
      // Advance time by 2 hours
      vi.setSystemTime(now + 2 * 60 * 60 * 1000);
      
      const result = await store.getPermission('test:key');
      expect(result).toBeNull();
    });
  });

  describe('setPermission', () => {
    it('should set permission without expiry', async () => {
      await store.setPermission('test:key', true);
      const result = await store.getPermission('test:key');
      expect(result?.granted).toBe(true);
      expect(result?.expiresAt).toBeUndefined();
    });

    it('should set permission with expiry', async () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      await store.setPermission('test:key', true, '1h');
      const result = await store.getPermission('test:key');
      
      expect(result?.granted).toBe(true);
      expect(result?.expiresAt).toBe(now + 60 * 60 * 1000);
    });

    it('should not store permission for "once" expiry', async () => {
      await store.setPermission('test:key', true, 'once');
      const result = await store.getPermission('test:key');
      expect(result).toBeNull();
    });

    it('should handle session expiry', async () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      await store.setPermission('test:key', true, 'session');
      const result = await store.getPermission('test:key');
      
      expect(result?.granted).toBe(true);
      expect(result?.expiresAt).toBe(now + 24 * 60 * 60 * 1000);
    });
  });

  describe('removePermission', () => {
    it('should remove existing permission', async () => {
      await store.setPermission('test:key', true);
      await store.removePermission('test:key');
      const result = await store.getPermission('test:key');
      expect(result).toBeNull();
    });
  });

  describe('clearExpiredPermissions', () => {
    it('should remove expired permissions', async () => {
      const now = Date.now();
      vi.setSystemTime(now);
      
      await store.setPermission('expired1', true, '1h');
      await store.setPermission('expired2', true, '2h');
      await store.setPermission('valid', true, '3h');
      
      // Advance time by 1.5 hours
      vi.setSystemTime(now + 1.5 * 60 * 60 * 1000);
      
      await store.clearExpiredPermissions();
      
      expect(await store.getPermission('expired1')).toBeNull();
      expect(await store.getPermission('expired2')).toBeTruthy();
      expect(await store.getPermission('valid')).toBeTruthy();
    });
  });
});

describe('generatePermissionKey', () => {
  it('should generate basic key', () => {
    const key = generatePermissionKey('user123', 'ToolA');
    expect(key).toBe('user123:ToolA');
  });

  it('should generate key with params', () => {
    const key = generatePermissionKey('user123', 'ToolA', { param1: 'value1' });
    expect(key).toMatch(/^user123:ToolA:[a-f0-9]+$/);
  });

  it('should generate consistent hash for same params', () => {
    const key1 = generatePermissionKey('user123', 'ToolA', { param1: 'value1', param2: 'value2' });
    const key2 = generatePermissionKey('user123', 'ToolA', { param2: 'value2', param1: 'value1' });
    expect(key1).toBe(key2);
  });
});