// scripts/test-photon.js
const fetch = require("node-fetch");

async function test() {
  const query = "Imbulpe, Ratnapura, Sri Lanka";
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.features && data.features.length > 0) {
      const feat = data.features[0];
      const [lng, lat] = feat.geometry.coordinates;
      console.log(`✅ Photon resolved: ${query} -> lat: ${lat}, lng: ${lng}`);
    } else {
      console.log(`❌ Photon failed: ${query}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
