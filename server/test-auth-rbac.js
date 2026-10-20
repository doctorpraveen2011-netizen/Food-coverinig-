// Automated RBAC & Authentication Test Suite for FoodCovering 2.0
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== FOODCOVERING 2.0 RBAC & AUTHENTICATION TEST SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. Missing Token Test -> 401
    const resUnauth = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    assert(resUnauth.status === 401, 'Unauthenticated request to /api/admin/dashboard returns 401');

    // 2. Invalid Credentials Test -> 401
    const resBadLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@foodcovering.gov', password: 'WrongPassword999!' });
    assert(resBadLogin.status === 401, 'Invalid credentials rejected with 401');

    // 3. Normal User Registration -> 201 and role is NORMAL_USER
    const testEmail = `test_user_${Date.now()}@example.com`;
    const resReg = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Test Citizen',
      email: testEmail,
      phone: '+91 99887 76655',
      password: 'User@Secure123',
      confirmPassword: 'User@Secure123',
      address: 'Test Street, New Delhi'
    });
    assert(resReg.status === 201 && resReg.data.user.role === 'NORMAL_USER', 'Normal user registration returns 201 with NORMAL_USER role');
    const normalToken = resReg.data.token;

    // 4. Normal User Access to User Dashboard -> 200
    const resUserDash = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/user/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    assert(resUserDash.status === 200, 'Normal user can access /api/user/dashboard (200)');

    // 5. Normal User Attempt to Access Admin Dashboard -> 403 Forbidden
    const resUserToAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    assert(resUserToAdmin.status === 403, 'Normal user attempting /api/admin/dashboard blocked with 403 Forbidden');

    // 6. Normal User Attempt to Access Supermarket Dashboard -> 403 Forbidden
    const resUserToSm = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/supermarket/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    assert(resUserToSm.status === 403, 'Normal user attempting /api/supermarket/dashboard blocked with 403 Forbidden');

    // 7. Supermarket Official Login -> 200 with SUPERMARKET_OFFICIAL role
    const resSmLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'official@freshmart.com', password: 'Official@123' });
    assert(resSmLogin.status === 200 && resSmLogin.data.user.role === 'SUPERMARKET_OFFICIAL', 'Supermarket official login returns 200 with SUPERMARKET_OFFICIAL role');
    const smToken = resSmLogin.data.token;

    // 8. Supermarket Official Access to Supermarket Dashboard -> 200
    const resSmDash = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/supermarket/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${smToken}` }
    });
    assert(resSmDash.status === 200 && resSmDash.data.supermarket.id === 'sm-001', 'Supermarket official receives scoped store dashboard (200)');

    // 9. Supermarket Official Attempt to Access Admin Dashboard -> 403 Forbidden
    const resSmToAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${smToken}` }
    });
    assert(resSmToAdmin.status === 403, 'Supermarket official attempting /api/admin/dashboard blocked with 403 Forbidden');

    // 10. Supermarket Official Data Isolation: Cannot modify sm-002 inventory
    const resSm2Login = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'official@greenbasket.com', password: 'Official@123' });
    const sm2Token = resSm2Login.data.token;

    const resCreateSm2Item = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/supermarket/inventory',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sm2Token}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Organic Honey Batch',
      category: 'General Grocery',
      batchNumber: 'OH-2026-01',
      expiryDate: '2026-12-31',
      quantity: 50
    });
    const sm2ItemId = resCreateSm2Item.data?.item?.id || 'inv-006';

    const resSmCrossTenant = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/supermarket/inventory/${sm2ItemId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${smToken}`,
        'Content-Type': 'application/json'
      }
    }, { quantity: 999 });
    assert(resSmCrossTenant.status === 403, 'Supermarket official blocked from modifying another supermarket inventory with 403 Forbidden');

    // 11. Head Office Administrator Login -> 200 with HEAD_OFFICE_ADMIN role
    const resAdminLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@foodcovering.gov', password: 'Admin@Secure2026!' });
    assert(resAdminLogin.status === 200 && resAdminLogin.data.user.role === 'HEAD_OFFICE_ADMIN', 'Head Office Administrator login returns 200 with HEAD_OFFICE_ADMIN role');
    const adminToken = resAdminLogin.data.token;

    // 12. Head Office Administrator Access to Admin Dashboard -> 200
    const resAdminDash = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(resAdminDash.status === 200 && resAdminDash.data.kpis.activeSupermarkets >= 1, 'Head Office Administrator accesses executive dashboard (200)');

    // 13. Head Office Admin Provisions Supermarket Official Account -> 201
    const resProvisionOfficial = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/supermarket-officials',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      fullName: 'Vikram Joshi (Store Manager)',
      email: `vikram_${Date.now()}@metrodaily.in`,
      password: 'Official@Pass2026!',
      supermarketId: 'sm-003',
      phone: '+91 98999 11223'
    });
    assert(resProvisionOfficial.status === 201 && resProvisionOfficial.data.user.role === 'SUPERMARKET_OFFICIAL', 'Admin provisions new Supermarket Official account with 201');

    console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

setTimeout(runTests, 1000);
