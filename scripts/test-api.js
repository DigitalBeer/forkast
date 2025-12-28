const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 5000;

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, status, message = '') {
  const statusColor = status === 'PASS' ? colors.green : colors.red;
  const statusIcon = status === 'PASS' ? '✓' : '✗';
  log(`${statusIcon} ${testName}`, statusColor);
  if (message) {
    log(`  ${message}`, colors.yellow);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const requestOptions = {
      timeout: TEST_TIMEOUT,
      ...options
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          body: data ? (() => {
            try { return JSON.parse(data); } catch { return data; }
          })() : null
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testGetMeals() {
  totalTests++;
  try {
    const response = await makeRequest(`${BASE_URL}/api/meals`);
    
    if (response.statusCode === 200) {
      passedTests++;
      logTest('GET /api/meals', 'PASS', `Status: ${response.statusCode}`);
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      passedTests++;
      logTest('GET /api/meals', 'PASS', `Auth required (${response.statusCode}) - Expected behavior`);
    } else {
      failedTests++;
      logTest('GET /api/meals', 'FAIL', `Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    failedTests++;
    logTest('GET /api/meals', 'FAIL', `Error: ${error.message}`);
  }
}

async function testPostMealsValid() {
  totalTests++;
  try {
    const validMealData = {
      name: 'Test Meal',
      description: 'A test meal for API validation',
      ingredients: ['Test Ingredient 1', 'Test Ingredient 2'],
      tags: ['test', 'api']
    };

    const response = await makeRequest(`${BASE_URL}/api/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validMealData)
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      passedTests++;
      logTest('POST /api/meals (valid data)', 'PASS', `Status: ${response.statusCode}`);
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      passedTests++;
      logTest('POST /api/meals (valid data)', 'PASS', `Auth required (${response.statusCode}) - Expected behavior`);
    } else {
      failedTests++;
      logTest('POST /api/meals (valid data)', 'FAIL', `Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    failedTests++;
    logTest('POST /api/meals (valid data)', 'FAIL', `Error: ${error.message}`);
  }
}

async function testPostMealsInvalid() {
  totalTests++;
  try {
    const invalidMealData = {
      // Missing required fields
      description: 'Invalid meal data'
    };

    const response = await makeRequest(`${BASE_URL}/api/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidMealData)
    });

    if (response.statusCode === 400) {
      passedTests++;
      logTest('POST /api/meals (invalid data)', 'PASS', 'Correctly rejected invalid data');
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      passedTests++;
      logTest('POST /api/meals (invalid data)', 'PASS', `Auth required (${response.statusCode}) - Expected behavior`);
    } else {
      failedTests++;
      logTest('POST /api/meals (invalid data)', 'FAIL', `Expected 400, got: ${response.statusCode}`);
    }
  } catch (error) {
    failedTests++;
    logTest('POST /api/meals (invalid data)', 'FAIL', `Error: ${error.message}`);
  }
}

async function testServerHealth() {
  totalTests++;
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.statusCode >= 200 && response.statusCode < 400) {
      passedTests++;
      logTest('Server Health Check', 'PASS', `Server responding (${response.statusCode})`);
    } else {
      failedTests++;
      logTest('Server Health Check', 'FAIL', `Server error: ${response.statusCode}`);
    }
  } catch (error) {
    failedTests++;
    logTest('Server Health Check', 'FAIL', `Server not accessible: ${error.message}`);
  }
}

async function testApiDocsEndpoint() {
  totalTests++;
  try {
    const response = await makeRequest(`${BASE_URL}/api-docs`);
    
    if (response.statusCode === 200) {
      passedTests++;
      logTest('API Documentation', 'PASS', 'API docs accessible');
    } else if (response.statusCode === 404) {
      passedTests++;
      logTest('API Documentation', 'PASS', 'API docs not configured (expected)');
    } else {
      failedTests++;
      logTest('API Documentation', 'FAIL', `Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    failedTests++;
    logTest('API Documentation', 'FAIL', `Error: ${error.message}`);
  }
}

async function runAllTests() {
  log(`${colors.bold}${colors.blue}🚀 Starting API Integration Tests${colors.reset}`);
  log(`${colors.blue}Target: ${BASE_URL}${colors.reset}`);
  log('');

  // Run all tests
  await testServerHealth();
  await testGetMeals();
  await testPostMealsValid();
  await testPostMealsInvalid();
  await testApiDocsEndpoint();

  // Print summary
  log('');
  log(`${colors.bold}📊 Test Results Summary${colors.reset}`);
  log(`Total Tests: ${totalTests}`);
  log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const summaryColor = successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red;
  log(`${summaryColor}Success Rate: ${successRate}%${colors.reset}`);

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n❌ Tests interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`\n\n💥 Uncaught exception: ${error.message}`, colors.red);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  log(`\n\n💥 Test execution failed: ${error.message}`, colors.red);
  process.exit(1);
});
