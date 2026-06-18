require('dotenv').config();
const adminService = require('../src/modules/admin/adminService');

async function test() {
  try {
    console.log('Testing getAuditLogs...');
    const result = await adminService.getAuditLogs();
    console.log('Logs retrieved successfully:', result);
  } catch (err) {
    console.error('Error fetching logs:', err);
  }
}

test();
