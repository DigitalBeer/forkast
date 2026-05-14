# QA Guidelines for Forkast

## Testing Philosophy
- **Test Early, Test Often**: Write tests alongside feature development
- **Test Coverage**: Aim for at least 60% code coverage (ratchet up from baseline)
- **Clean Tests**: Follow the Arrange-Act-Assert pattern
- **Deterministic Tests**: Tests should be reliable and not flaky

## Test Types

### 1. Unit Tests (Vitest)
- Test individual functions and modules in isolation
- Mock external dependencies (Supabase, Next.js APIs)
- Focus on business logic
- Naming convention: `describe('module', () => { it('should ...', ...) })`
- File convention: `__tests__/module.test.ts` or `__tests__/module.test.tsx`

### 2. Integration Tests
- Test interactions between components
- Mock Supabase client but test full request/response cycles
- Test API endpoints via route handler unit tests
- Naming convention: `describe('feature', () => { it('should ...', ...) })`

### 3. End-to-End Tests (Playwright)
- Test complete user flows
- Use headless browsers (Chromium, Firefox, WebKit)
- Test critical paths
- File convention: `e2e/*.spec.ts`

## Test Structure
```
src/
├── lib/
│   ├── shopping/
│   │   ├── __tests__/
│   │   │   └── shopping.test.ts
│   │   └── aggregate.ts
│   ├── measurements/
│   │   ├── __tests__/
│   │   │   └── measurements.test.ts
│   │   └── conversions.ts
│   ├── localStorage/
│   │   ├── __tests__/
│   │   │   └── localStorage.test.ts
│   │   └── tags.ts
│   └── services/
│       ├── __tests__/
│       │   └── services.test.ts
│       └── suggestionService.ts
├── app/
│   └── api/
│       ├── meals/
│       │   ├── __tests__/
│       │   │   └── route.test.ts
│       │   └── route.ts
│       └── shopping-list/
│           ├── __tests__/
│           │   └── route.test.ts
│           └── route.ts
e2e/
├── auth.spec.ts
├── dashboard.spec.ts
├── meals.spec.ts
├── meal-planner.spec.ts
├── meal-form.spec.ts
└── ...
```

## Best Practices
- **Vitest Globals**: Use `globals: true` — no need to import `describe`/`it`/`expect` (but explicit imports are fine too)
- **Descriptive Names**: Test names should describe behavior, not implementation
- **One Assert Per Test**: Each test should verify one behavior
- **Test Isolation**: Tests should not depend on each other
- **Test Data**: Use factories for test data generation

## Running Tests
```bash
# Run all unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/lib/shopping/__tests__/shopping.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in a single browser
npm run test:e2e -- --project=chromium

# Lint
npm run lint

# Type check
npm run type-check
```

## Code Review Checklist
- [ ] Tests cover all new functionality
- [ ] Tests are passing
- [ ] Code follows style guide
- [ ] Edge cases are handled
- [ ] Error messages are clear and helpful
- [ ] Documentation is updated

## Mocking Patterns

### Mocking Supabase Client
```typescript
import { vi } from 'vitest';

const mockSupabase = {
  auth: { getSession: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabase),
}));
```

### Mocking localStorage (jsdom)
```typescript
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
```

### Mocking Next.js Server Components
```typescript
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}));
```

## Performance Testing
- Test critical paths under load
- Monitor memory usage
- Set performance baselines
- Run performance tests in CI/CD pipeline

## Security Testing
- Test for common vulnerabilities (OWASP Top 10)
- Validate all inputs
- Test authentication/authorization
- Check for sensitive data exposure

## Continuous Integration
- Run linting and type-checking on every push/PR
- Run unit tests with coverage on every push/PR
- Run E2E tests on every push/PR
- Fail build on test failures
- Enforce code coverage thresholds

## Test Maintenance
- Update tests when features change
- Remove or update flaky tests
- Keep test data up to date
- Regularly review test coverage

## Reporting
- Generate test reports via Vitest and Playwright reporters
- Track test metrics over time
- Document test failures
- Share results with the team

## Tools
- **Unit Testing Framework**: Vitest
- **Test Environment**: jsdom (for unit tests), real browsers (for E2E)
- **Test Coverage**: @vitest/coverage-v8
- **Mocking**: vi.mock(), vi.fn(), vi.spyOn()
- **E2E Testing**: Playwright
- **Linting**: ESLint
- **Type Checking**: TypeScript (tsc --noEmit)

## Common Pitfalls
- Testing implementation details instead of behavior
- Over-mocking
- Flaky tests
- Slow test suites
- Not testing error cases

## Code Examples

### Unit Test Example (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import { convertWeight } from '@/lib/measurements/conversions';

describe('convertWeight', () => {
  it('converts g to kg', () => {
    expect(convertWeight(1000, 'g', 'kg')).toBeCloseTo(1, 2);
  });

  it('returns same value when units match', () => {
    expect(convertWeight(5, 'g', 'g')).toBe(5);
  });
});
```

### API Route Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

import { GET } from '../route';

describe('GET /api/meals', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const response = await GET();
    expect(response.status).toBe(401);
  });
});
```

### E2E Test Example (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('user can view meal plan', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByTestId('meal-plan')).toBeVisible();
});
```

## Continuous Integration Example
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage

  e2e-tests:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Test Data Management
- Use factories for test data
- Clean up after tests
- Use realistic data
- Consider edge cases

## Common Issues and Solutions
- **Flaky Tests**: Make tests more deterministic
- **Slow Tests**: Optimize database queries, use mocks
- **Test Pollution**: Ensure proper cleanup with beforeEach/afterEach
- **Intermittent Failures**: Add retries, check timing issues

## Monitoring and Reporting
- Track test duration
- Monitor test failures
- Generate test reports
- Visualize test coverage