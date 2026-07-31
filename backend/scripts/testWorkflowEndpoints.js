async function testEndpoints() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: 'ADMIN001', password: 'admin123' })
    });
    if (!loginRes.ok) {
      console.log('Login failed:', loginRes.status, await loginRes.text());
      return;
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Got token:', token ? 'YES' : 'NO');
    
    // Create a new complaint to get an incident ID
    const complaintRes = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Workflow Endpoint Test',
        description: 'Testing the events and plans endpoints',
        lat: 12.9715987,
        lng: 77.5945627,
        address: 'Test Addr',
        raw_input_type: 'text'
      })
    });
    if (!complaintRes.ok) {
      console.log('Complaint failed:', complaintRes.status, await complaintRes.text());
      return;
    }
    const complaintData = await complaintRes.json();
    const incidentId = complaintData.incident_id || (complaintData.data && complaintData.data.incident_id);
    console.log('Incident ID:', incidentId);
    
    // Wait a couple seconds for workflow events to generate
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test Events Endpoint
    const eventsRes = await fetch(`http://localhost:5000/api/workflows/${incidentId}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!eventsRes.ok) {
      console.log('Events failed:', eventsRes.status, await eventsRes.text());
    } else {
      const eventsData = await eventsRes.json();
      console.log('Events Data Length:', eventsData.length);
    }
    
    // Test Plans Endpoint
    const plansRes = await fetch(`http://localhost:5000/api/workflows/${incidentId}/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!plansRes.ok) {
      console.log('Plans failed:', plansRes.status, await plansRes.text());
    } else {
      const plansData = await plansRes.json();
      console.log('Plans Data Length:', plansData.length);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testEndpoints();
