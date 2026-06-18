const adminService = require('./src/modules/admin/adminService');

async function test() {
  try {
    console.log("Testing getRevenueChartData...");
    const chartData = await adminService.getRevenueChartData(2026);
    console.log("Chart Data:", chartData);

    console.log("Testing getTopLocations...");
    const locations = await adminService.getTopLocations();
    console.log("Locations:", locations);
    
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
