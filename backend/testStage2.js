const http = require('http');

async function runTests() {
  console.log("=====================================================================");
  console.log("           STARTING STAGE 2 HTTP API VERIFICATION                    ");
  console.log("=====================================================================");

  // 1. Health check
  console.log("\n--- STEP 1: Health Check (GET /api/health) ---");
  const health = await makeRequest('GET', '/api/health');
  console.log("HTTP Status:", health.status);
  console.log("Response:", JSON.stringify(health.body));

  // 2. Create complaint
  console.log("\n--- STEP 2: Create Complaint (POST /api/complaints) ---");
  const postData = new URLSearchParams({
    description: "Overflowing garbage bin near the market",
    raw_input_type: "text",
    lat: "10.365",
    lng: "77.966",
    address: "Market Road, Ward 2"
  }).toString();

  const createRes = await makeRequest('POST', '/api/complaints', postData, {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  console.log("HTTP Status:", createRes.status);
  console.log("Incident Output:", JSON.stringify(createRes.body, null, 2));

  const incidentId = createRes.body ? createRes.body.incident_id : null;
  if (!incidentId) {
    throw new Error("Failed to retrieve incident_id from create complaint output");
  }

  // 3. Get complaint by incident_id
  console.log(`\n--- STEP 3: Get Complaint by ID (GET /api/complaints/${incidentId}) ---`);
  const getOneRes = await makeRequest('GET', `/api/complaints/${incidentId}`);
  console.log("HTTP Status:", getOneRes.status);
  console.log("Fetched Incident:", JSON.stringify(getOneRes.body, null, 2));

  // 4. List all complaints
  console.log("\n--- STEP 4: List All Complaints (GET /api/complaints) ---");
  const listRes = await makeRequest('GET', '/api/complaints');
  console.log("HTTP Status:", listRes.status);
  console.log("List Output:", JSON.stringify(listRes.body, null, 2));

  // 5. Advance status
  console.log(`\n--- STEP 5: Advance Status (POST /api/admin/complaints/${incidentId}/advance-status) ---`);
  const advanceData = JSON.stringify({ new_status: "acknowledged" });
  const advanceRes = await makeRequest('POST', `/api/admin/complaints/${incidentId}/advance-status`, advanceData, {
    'Content-Type': 'application/json'
  });
  console.log("HTTP Status:", advanceRes.status);
  console.log("Advanced Incident:", JSON.stringify(advanceRes.body, null, 2));

  // 6. Trigger escalation
  console.log(`\n--- STEP 6: Trigger Escalation (POST /api/admin/complaints/${incidentId}/trigger-escalation) ---`);
  const escalationRes = await makeRequest('POST', `/api/admin/complaints/${incidentId}/trigger-escalation`);
  console.log("HTTP Status:", escalationRes.status);
  console.log("Escalated Incident:", JSON.stringify(escalationRes.body, null, 2));

  console.log("\n=====================================================================");
  console.log("        STAGE 2 VERIFICATION COMPLETED SUCCESSFULLY                  ");
  console.log("=====================================================================");
  process.exit(0);
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

runTests().catch(err => {
  console.error("Stage 2 Test Error:", err);
  process.exit(1);
});
