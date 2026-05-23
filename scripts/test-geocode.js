// scripts/test-geocode.js
const fetch = require("node-fetch"); // or use global fetch if node version supports it

async function test() {
  const lgas = [
    "Imbulpe",
    "Balangoda",
    "Kahawatta",
    "Pelmadulla",
    "Homagama"
  ];
  const districts = [
    "Ratnapura",
    "Ratnapura",
    "Ratnapura",
    "Ratnapura",
    "Colombo"
  ];

  for (let i = 0; i < lgas.length; i++) {
    const lga = lgas[i];
    const dist = districts[i];
    const query = `${lga}, ${dist}, Sri Lanka`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "AlertZone-LGA-Resolver-Test (contact: admin@alertzone.lk)"
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        console.log(`✅ ${lga} (${dist}) -> lat: ${data[0].lat}, lon: ${data[0].lon}`);
      } else {
        console.log(`❌ ${lga} (${dist}) -> Not found`);
      }
    } catch (err) {
      console.error(`💥 Error geocoding ${lga}:`, err.message);
    }
    // Respect Nominatim rate limit of 1s
    await new Promise(r => setTimeout(r, 1000));
  }
}

test();
