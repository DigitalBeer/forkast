// Ambient types for Vitest's `globals: true` mode (see vitest.config.ts).
// Without this, `tsc --noEmit` can't see `describe`/`it`/`expect`/etc. in
// test files that rely on the injected globals instead of importing them
// from 'vitest' directly.
/// <reference types="vitest/globals" />
