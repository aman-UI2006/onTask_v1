const http = require('http');

const ENDPOINTS = [
  { name: 'Core Server', url: 'http://localhost:5000/health' },
  { name: 'Auth / Me', url: 'http://localhost:5000/api/auth/me' },
  { name: 'Employee Directory', url: 'http://localhost:5000/api/auth/employees' },
  { name: 'Projects List', url: 'http://localhost:5000/api/projects/all' },
  { name: 'My Reports', url: 'http://localhost:5000/api/reports/my-reports' },
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(null);
    });
  });
}

async function checkHealth() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting AI-PM System Health Check (Zero-Dependency)...');
  console.log('-------------------------------------------');

  let successCount = 0;

  for (const endpoint of ENDPOINTS) {
    const status = await checkUrl(endpoint.url);
    if (status) {
      // 401/403 is a pass for connectivity.
      if (status < 400 || status === 401 || status === 403) {
        const type = status < 400 ? 'ONLINE' : 'PROTECTED';
        console.log(`✅ ${endpoint.name.padEnd(20)}: ${type} (${status})`);
        successCount++;
      } else {
        console.log(`❌ ${endpoint.name.padEnd(20)}: ERROR (${status})`);
      }
    } else {
      console.log(`❌ ${endpoint.name.padEnd(20)}: OFFLINE (No Response)`);
    }
  }

  console.log('-------------------------------------------');
  const rate = (successCount / ENDPOINTS.length) * 100;
  if (rate === 100) {
    console.log('\x1b[32m%s\x1b[0m', `OVERALL STATUS: PERFECT (${rate}%)`);
    console.log('All backend engines are responding correctly.');
  } else {
    console.log('\x1b[31m%s\x1b[0m', `OVERALL STATUS: ISSUES DETECTED (${rate}%)`);
    console.log('Please ensure the backend server is running on port 5000.');
  }
}

checkHealth();
