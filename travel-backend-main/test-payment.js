const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/payments/create', {
      bookingType: 'CORPORATE_BATCH',
      corporateBatchId: 1, // Sending a valid integer
      amount: 100000,
      method: 'bank_transfer'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
  }
})();
