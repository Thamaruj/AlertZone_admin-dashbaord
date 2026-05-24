// scripts/get-missing-lgas.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const CACHE_FILE = path.join(__dirname, "../lga-coordinates-cache.json");

const sriLankaGeographics = {
  "Western": {
    "Colombo": [
      "Colombo Municipal Council",
      "Dehiwala-Mount Lavinia Municipal Council",
      "Sri Jayawardenepura Kotte Municipal Council",
      "Kaduwela Municipal Council",
      "Moratuwa Municipal Council",
      "Kolonnawa Urban Council",
      "Maharagama Urban Council",
      "Boralesgamuwa Urban Council",
      "Kesbewa Urban Council",
      "Homagama Pradeshiya Sabha",
      "Seethawaka Pradeshiya Sabha",
      "Kotikawatta-Mulleriyawa Pradeshiya Sabha"
    ],
    "Gampaha": [
      "Negombo Municipal Council",
      "Gampaha Municipal Council",
      "Wattala-Mabole Urban Council",
      "Peliyagoda Urban Council",
      "Ja-Ela Urban Council",
      "Katunayake-Seeduwa Urban Council",
      "Minuwangoda Urban Council",
      "Kelaniya Pradeshiya Sabha",
      "Wattala Pradeshiya Sabha",
      "Biyagama Pradeshiya Sabha",
      "Mahara Pradeshiya Sabha",
      "Dompe Pradeshiya Sabha",
      "Gampaha Pradeshiya Sabha",
      "Ja-Ela Pradeshiya Sabha",
      "Minuwangoda Pradeshiya Sabha",
      "Mirigama Pradeshiya Sabha",
      "Attanagalla Pradeshiya Sabha",
      "Divulapitiya Pradeshiya Sabha"
    ],
    "Kalutara": [
      "Kalutara Urban Council",
      "Panadura Urban Council",
      "Horana Urban Council",
      "Beruwala Urban Council",
      "Kalutara Pradeshiya Sabha",
      "Panadura Pradeshiya Sabha",
      "Horana Pradeshiya Sabha",
      "Bandaragama Pradeshiya Sabha",
      "Madurawela Pradeshiya Sabha",
      "Angalawatta Pradeshiya Sabha",
      "Bulathsinhala Pradeshiya Sabha",
      "Dodangoda Pradeshiya Sabha",
      "Mathugama Pradeshiya Sabha",
      "Walallawita Pradeshiya Sabha",
      "Beruwala Pradeshiya Sabha"
    ]
  },
  "North Central": {
    "Anuradhapura": [
      "Anuradhapura Municipal Council",
      "Anuradhapura Pradeshiya Sabha",
      "Padaviya Pradeshiya Sabha",
      "Kebithigollewa Pradeshiya Sabha",
      "Medawachchiya Pradeshiya Sabha",
      "Rambewa Pradeshiya Sabha",
      "Kahatagasdigiliya Pradeshiya Sabha",
      "Horowpothana Pradeshiya Sabha",
      "Galenbindunuwewa Pradeshiya Sabha",
      "Mihintale Pradeshiya Sabha",
      "Nuwaragam Palatha Central Pradeshiya Sabha",
      "Nuwaragam Palatha East Pradeshiya Sabha",
      "Vilachchiya Pradeshiya Sabha",
      "Nachchaduwa Pradeshiya Sabha",
      "Noctchiyagama Pradeshiya Sabha",
      "Rajanganaya Pradeshiya Sabha",
      "Galnewa Pradeshiya Sabha",
      "Thalawa Pradeshiya Sabha",
      "Ipalogama Pradeshiya Sabha",
      "Kekirawa Pradeshiya Sabha",
      "Thirappane Pradeshiya Sabha",
      "Habarana Pradeshiya Sabha",
      "Palugaswewa Pradeshiya Sabha"
    ]
  },
  "Sabaragamuwa": {
    "Ratnapura": [
      "Ratnapura Municipal Council",
      "Balangoda Urban Council",
      "Embilipitiya Urban Council",
      "Ratnapura Pradeshiya Sabha",
      "Imbulpe Pradeshiya Sabha",
      "Balangoda Pradeshiya Sabha",
      "Opanayaka Pradeshiya Sabha",
      "Pelmadulla Pradeshiya Sabha",
      "Elapatha Pradeshiya Sabha",
      "Kuruvita Pradeshiya Sabha",
      "Eheliyagoda Pradeshiya Sabha",
      "Ayagama Pradeshiya Sabha",
      "Kalawana Pradeshiya Sabha",
      "Kahawatta Pradeshiya Sabha",
      "Godakawela Pradeshiya Sabha",
      "Weligepola Pradeshiya Sabha",
      "Embilipitiya Pradeshiya Sabha",
      "Kolonna Pradeshiya Sabha"
    ],
    "Kegalle": [
      "Kegalle Urban Council",
      "Kegalle Pradeshiya Sabha",
      "Galigamuwa Pradeshiya Sabha",
      "Warakapola Pradeshiya Sabha",
      "Ruwanwella Pradeshiya Sabha",
      "Yatiyanthota Pradeshiya Sabha",
      "Dehiowita Pradeshiya Sabha",
      "Deraniyagala Pradeshiya Sabha",
      "Karawanella Pradeshiya Sabha",
      "Rambukkana Pradeshiya Sabha",
      "Mawanella Pradeshiya Sabha",
      "Aranayaka Pradeshiya Sabha"
    ]
  }
};

const DISTRICT_CENTERS = {
  "Colombo": { lat: 6.9355, lng: 79.8487 },
  "Gampaha": { lat: 7.0899, lng: 79.9994 },
  "Kalutara": { lat: 6.5793, lng: 79.9648 },
  "Ratnapura": { lat: 6.6931, lng: 80.3995 },
  "Kegalle": { lat: 7.2515, lng: 80.3464 },
  "Anuradhapura": { lat: 8.3122, lng: 80.4131 }
};

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch (err) {
    console.error("Error reading cache:", err.message);
  }
}

function cleanLgaName(lga) {
  return lga
    .replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "")
    .replace(/Four Gravets|Gravets & Gangawata Korale|Town & Gravets/gi, "")
    .replace(/ Tamil| Sinhala/gi, "")
    .trim();
}

async function geocode(lga, district) {
  const cacheKey = `${district} -> ${lga}`;
  // Skip already resolved and non-fallback cached coordinates
  if (cache[cacheKey] && !cache[cacheKey].isFallback) {
    return cache[cacheKey];
  }

  const shortName = cleanLgaName(lga);
  const queries = [
    `${shortName}, ${district}, Sri Lanka`,
    `${shortName}, Sri Lanka`,
    `${lga}, ${district}, Sri Lanka`
  ];

  for (let q of queries) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[0];
        const [lng, lat] = feat.geometry.coordinates;
        const coords = { lat, lng };
        cache[cacheKey] = coords;
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
        console.log(`✅ Geocoded via Photon: ${cacheKey} -> ${coords.lat}, ${coords.lng}`);
        await new Promise(r => setTimeout(r, 500)); // Courteous delay
        return coords;
      }
    } catch (err) {
      console.error(`💥 Error geocoding "${q}":`, err.message);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Fallback to district center
  console.log(`⚠️ Failed geocoding for "${cacheKey}". Using district center.`);
  const distCenter = DISTRICT_CENTERS[district] || { lat: 7.0, lng: 80.0 };
  const fallbackCoords = { lat: distCenter.lat, lng: distCenter.lng, isFallback: true };
  cache[cacheKey] = fallbackCoords;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  return fallbackCoords;
}

async function run() {
  const result = {};
  
  // Flatten active districts LGAs
  const queue = [];
  for (const [prov, dists] of Object.entries(sriLankaGeographics)) {
    for (const [dist, lgas] of Object.entries(dists)) {
      for (const lga of lgas) {
        queue.push({ prov, dist, lga });
      }
    }
  }

  console.log(`🚀 Starting geocoding of remaining LGAs...`);
  
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    console.log(`[${i + 1}/${queue.length}] Processing: ${item.dist} -> ${item.lga}`);
    const coords = await geocode(item.lga, item.dist);
    
    if (!result[item.prov]) result[item.prov] = {};
    if (!result[item.prov][item.dist]) result[item.prov][item.dist] = {};
    result[item.prov][item.dist][item.lga] = coords;
  }

  // Generate output JSON structure
  const formatted = JSON.stringify(result, null, 2);
  fs.writeFileSync(path.join(__dirname, "../lga-coordinates-completed.json"), formatted, "utf8");
  console.log(`🎉 Completed! Output saved to lga-coordinates-completed.json`);
}

run();
