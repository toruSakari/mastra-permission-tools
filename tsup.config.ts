import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  // テストファイルを除外
  external: ['react', 'react-dom'],
  // テストファイルをビルドから除外
  ignoreWatch: ['**/*.test.ts', '**/*.test.tsx'],
  onSuccess: 'tsc --noEmit',
});