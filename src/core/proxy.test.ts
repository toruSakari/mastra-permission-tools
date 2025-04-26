import { describe, it, expect, vi } from 'vitest';
import { createToolExecutionProxy, isProxiedTool, chainProxyHooks } from '../../src/core/proxy';
import type { Tool } from '@mastra/core/tools';
import type { ProxyHooks } from '../../src/types/proxy';

describe('proxy', () => {
  const createMockTool = (name: string): Tool => ({
    execute: vi.fn().mockResolvedValue({ result: `${name} executed` }),
  }) as unknown as Tool;

  const createMockHooks = (): ProxyHooks => ({
    beforeExecution: vi.fn().mockResolvedValue({ continue: true }),
    afterExecution: vi.fn().mockImplementation((_, result) => result),
    onError: vi.fn().mockResolvedValue({ error: 'test error' }),
  });

  describe('createToolExecutionProxy', () => {
    it('should wrap tools with proxy', () => {
      const tools = {
        tool1: createMockTool('tool1'),
        tool2: createMockTool('tool2'),
      };
      const hooks = createMockHooks();
      
      const proxiedTools = createToolExecutionProxy(tools, hooks);
      
      expect(Object.keys(proxiedTools)).toEqual(['tool1', 'tool2']);
      expect(isProxiedTool(proxiedTools.tool1)).toBe(true);
      expect(isProxiedTool(proxiedTools.tool2)).toBe(true);
    });

    it('should call hooks in correct order', async () => {
      const tool = createMockTool('test');
      const hooks = createMockHooks();
      
      const proxiedTools = createToolExecutionProxy({ test: tool }, hooks);
      
      await proxiedTools.test.execute({ context: { param: 'value' } });
      
      expect(hooks.beforeExecution).toHaveBeenCalledWith('test', { param: 'value' }, {});
      expect(tool.execute).toHaveBeenCalled();
      expect(hooks.afterExecution).toHaveBeenCalledWith('test', { result: 'test executed' }, {});
    });

    it('should handle permission denied', async () => {
      const tool = createMockTool('test');
      const hooks = createMockHooks();
      hooks.beforeExecution.mockResolvedValue({ continue: false, response: { denied: true } });
      
      const proxiedTools = createToolExecutionProxy({ test: tool }, hooks);
      
      const result = await proxiedTools.test.execute({ context: {} });
      
      expect(result).toEqual({ denied: true });
      expect(tool.execute).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const tool = createMockTool('test');
      (tool.execute as any).mockRejectedValue(new Error('test error'));
      const hooks = createMockHooks();
      
      const proxiedTools = createToolExecutionProxy({ test: tool }, hooks);
      
      const result = await proxiedTools.test.execute({ context: {} });
      
      expect(hooks.onError).toHaveBeenCalled();
      expect(result).toEqual({ error: 'test error' });
    });
  });

  describe('chainProxyHooks', () => {
    it('should chain hooks correctly', async () => {
      const hooks1 = createMockHooks();
      const hooks2 = createMockHooks();
      
      const chained = chainProxyHooks(hooks1, hooks2);
      
      await chained.beforeExecution('test', {}, {});
      
      expect(hooks1.beforeExecution).toHaveBeenCalled();
      expect(hooks2.beforeExecution).toHaveBeenCalled();
    });

    it('should stop chain if first hook denies', async () => {
      const hooks1 = createMockHooks();
      const hooks2 = createMockHooks();
      
      hooks1.beforeExecution.mockResolvedValue({ continue: false });
      
      const chained = chainProxyHooks(hooks1, hooks2);
      
      const result = await chained.beforeExecution('test', {}, {});
      
      expect(result.continue).toBe(false);
      expect(hooks2.beforeExecution).not.toHaveBeenCalled();
    });
  });
});