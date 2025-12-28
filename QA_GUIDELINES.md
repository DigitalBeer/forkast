# QA Guidelines for BMAD Meal Planner

## Testing Philosophy
- **Test Early, Test Often**: Write tests alongside feature development
- **Test Coverage**: Aim for at least 80% code coverage
- **Clean Tests**: Follow the Arrange-Act-Assert pattern
- **Deterministic Tests**: Tests should be reliable and not flaky

## Test Types

### 1. Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Focus on business logic
- Naming convention: `test_<function_name>_<scenario>_<expected_behavior>`

### 2. Integration Tests
- Test interactions between components
- Use test database
- Test API endpoints
- Naming convention: `test_<feature>_<scenario>_<expected_behavior>`

### 3. End-to-End Tests
- Test complete user flows
- Use headless browser for UI tests
- Test critical paths
- Naming convention: `test_e2e_<user_journey>`

## Test Structure
```
tests/
├── unit/
│   ├── __init__.py
│   └── test_<module_name>.py
├── integration/
│   ├── __init__.py
│   └── test_<feature>_integration.py
├── e2e/
│   ├── __init__.py
│   └── test_<user_flow>.py
└── conftest.py
```

## Best Practices
- **Fixtures**: Use pytest fixtures for test setup/teardown
- **Descriptive Names**: Test names should describe behavior, not implementation
- **One Assert Per Test**: Each test should verify one behavior
- **Test Isolation**: Tests should not depend on each other
- **Test Data**: Use factories for test data generation

## Running Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_module.py

# Run tests with coverage report
pytest --cov=app tests/

# Run tests in parallel
pytest -n auto
```

## Code Review Checklist
- [ ] Tests cover all new functionality
- [ ] Tests are passing
- [ ] Code follows style guide
- [ ] Edge cases are handled
- [ ] Error messages are clear and helpful
- [ ] Documentation is updated

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
- Run tests on every push/PR
- Fail build on test failures
- Enforce code coverage thresholds
- Run security scans

## Test Maintenance
- Update tests when features change
- Remove or update flaky tests
- Keep test data up to date
- Regularly review test coverage

## Reporting
- Generate test reports
- Track test metrics over time
- Document test failures
- Share results with the team

## Tools
- **Testing Framework**: pytest
- **Test Coverage**: coverage.py
- **Mocking**: unittest.mock or pytest-mock
- **E2E Testing**: Playwright
- **Performance Testing**: Locust
- **Security Testing**: Bandit, Safety

## Common Pitfalls
- Testing implementation details instead of behavior
- Over-mocking
- Flaky tests
- Slow test suites
- Not testing error cases

## Code Examples

### Unit Test Example
```python
def test_add_meal_to_plan_success(meal_plan, test_meal):
    # Arrange
    initial_count = len(meal_plan.meals)
    
    # Act
    meal_plan.add_meal(test_meal)
    
    # Assert
    assert len(meal_plan.meals) == initial_count + 1
    assert test_meal in meal_plan.meals
```

### Integration Test Example
```python
def test_create_meal_endpoint(client, auth_token):
    # Arrange
    meal_data = {
        'name': 'Test Meal',
        'ingredients': ['ing1', 'ing2'],
        'instructions': 'Test instructions'
    }
    
    # Act
    response = client.post(
        '/api/meals',
        json=meal_data,
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    # Assert
    assert response.status_code == 201
    assert 'id' in response.json
    assert response.json['name'] == meal_data['name']
```

### E2E Test Example
```python
def test_user_can_plan_meals(page, test_user):
    # Arrange
    page.goto('/login')
    
    # Act
    page.fill('#email', test_user.email)
    page.fill('#password', test_user.password)
    page.click('button[type="submit"]')
    
    # Assert
    assert page.url.endswith('/dashboard')
    
    # Continue with meal planning flow...
```

## Performance Test Example
```python
from locust import HttpUser, task, between

class MealPlannerUser(HttpUser):
    wait_time = between(1, 5)
    
    @task
    def view_meal_plan(self):
        self.client.get('/api/meal-plan')
    
    @task(3)  # 3x more likely to be called
    def search_recipes(self):
        self.client.get('/api/recipes?q=chicken')
```

## Security Test Example
```python
def test_sql_injection_protection(client):
    # Arrange
    malicious_input = "1'; DROP TABLE users;--"
    
    # Act
    response = client.get(f'/api/recipes?search={malicious_input}')
    
    # Assert
    assert response.status_code == 400  # Should not be 500
    assert 'error' in response.json
```

## Continuous Integration Example
```yaml
# .github/workflows/tests.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements-dev.txt
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
      run: |
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v1
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        file: ./coverage.xml
        fail_ci_if_error: true
```

## Test Data Management
- Use factories for test data
- Clean up after tests
- Use realistic data
- Consider edge cases

## Test Documentation
- Document test scenarios
- Explain complex test cases
- Keep test data documented
- Document test environment setup

## Performance Optimization
- Use transaction rollbacks
- Parallelize tests
- Use session-scoped fixtures
- Optimize test database setup

## Common Issues and Solutions
- **Flaky Tests**: Make tests more deterministic
- **Slow Tests**: Optimize database queries, use mocks
- **Test Pollution**: Ensure proper cleanup
- **Intermittent Failures**: Add retries, check timing issues

## Monitoring and Reporting
- Track test duration
- Monitor test failures
- Generate test reports
- Visualize test coverage

## Test Maintenance
- Review test coverage regularly
- Remove redundant tests
- Update tests with code changes
- Keep test data up to date

## Code Review Checklist for Tests
- [ ] Tests are readable and maintainable
- [ ] Tests cover edge cases
- [ ] Tests are independent
- [ ] Test data is appropriate
- [ ] Tests follow naming conventions
- [ ] Tests verify behavior, not implementation

## Final Notes
- Write tests that fail for the right reasons
- Keep tests simple and focused
- Test behavior, not implementation
- Maintain test data consistency
- Review test coverage regularly
