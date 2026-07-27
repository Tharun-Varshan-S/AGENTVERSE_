// TODO: replace with real agent logic (image classification, geocoding, etc.)

async function intakeAgent(incident, rawInput = {}) {
  const rawType = rawInput.raw_input_type || "text";
  const desc = rawInput.description || "Broken streetlight reported near main road junction";
  const lat = rawInput.lat !== undefined && !isNaN(Number(rawInput.lat)) ? Number(rawInput.lat) : 10.365;
  const lng = rawInput.lng !== undefined && !isNaN(Number(rawInput.lng)) ? Number(rawInput.lng) : 77.966;
  const address = rawInput.address || "Sample Address, Ward 1, Dindigul";
  const imageUrl = rawInput.image_url !== undefined ? rawInput.image_url : null;
  const category = rawInput.issue_category || "streetlight";

  return {
    raw_input_type: rawType,
    description: desc,
    issue_category: category,
    location: {
      lat: lat,
      lng: lng,
      address: address
    },
    image_url: imageUrl,
    confidence: 0.95
  };
}

module.exports = intakeAgent;
