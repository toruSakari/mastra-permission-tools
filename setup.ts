import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for tests
global.fetch = vi.fn();

// Mock crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});