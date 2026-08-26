import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // These components intentionally mirror browser state into React state
      // after mount (storage, media queries, subscriptions, and URL state).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '.open-next/**',
    'node_modules/**',
    'dist/**',
  ]),
]);
