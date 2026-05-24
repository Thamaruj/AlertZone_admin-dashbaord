// scripts/count-lgas.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "../service-account.json");

if (!fs.existsSync(keyPath)) {
  console.error("❌ Key file not found at:", keyPath);
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

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
    "Anuradhapura": { lat: 8.3122, lng: 80.4131 },
    "Ratnapura": { lat: 6.6931, lng: 80.3995 },
    "Kegalle": { lat: 7.2515, lng: 80.3464 }
  };

  const LGA_CENTERS = {
    "Western": {
      "Colombo": {
        "Colombo Municipal Council": { "lat": 6.9388614, "lng": 79.8542005 },
        "Dehiwala-Mount Lavinia Municipal Council": { "lat": 6.8369601, "lng": 79.8672866 },
        "Sri Jayawardenepura Kotte Municipal Council": { "lat": 6.8995498, "lng": 79.9058487 },
        "Kaduwela Municipal Council": { "lat": 6.9357027, "lng": 79.9843311 },
        "Moratuwa Municipal Council": { "lat": 6.7746821, "lng": 79.8826095 },
        "Kolonnawa Urban Council": { "lat": 6.9326254, "lng": 79.8903143 },
        "Maharagama Urban Council": { "lat": 6.8472783, "lng": 79.9266082 },
        "Boralesgamuwa Urban Council": { "lat": 6.8410598, "lng": 79.9017028 },
        "Kesbewa Urban Council": { "lat": 6.7957403, "lng": 79.940848 },
        "Homagama Pradeshiya Sabha": { "lat": 6.8412384, "lng": 80.0034457 },
        "Seethawaka Pradeshiya Sabha": { "lat": 6.9529483, "lng": 80.218633 },
        "Kotikawatta-Mulleriyawa Pradeshiya Sabha": { "lat": 6.9237932, "lng": 79.913672 }
      },
      "Gampaha": {
        "Negombo Municipal Council": { "lat": 7.2094282, "lng": 79.833117 },
        "Gampaha Municipal Council": { "lat": 7.0925595, "lng": 79.9951396 },
        "Wattala-Mabole Urban Council": { "lat": 6.9894897, "lng": 79.8932683 },
        "Peliyagoda Urban Council": { "lat": 6.9633651, "lng": 79.8818947 },
        "Ja-Ela Urban Council": { "lat": 7.0793775, "lng": 79.8907632 },
        "Katunayake-Seeduwa Urban Council": { "lat": 7.1096161, "lng": 79.8771943 },
        "Minuwangoda Urban Council": { "lat": 7.1488266, "lng": 79.9629756 },
        "Kelaniya Pradeshiya Sabha": { "lat": 6.9541637, "lng": 79.9182037 },
        "Wattala Pradeshiya Sabha": { "lat": 6.9898705, "lng": 79.8927094 },
        "Biyagama Pradeshiya Sabha": { "lat": 6.9540212, "lng": 79.9944255 },
        "Mahara Pradeshiya Sabha": { "lat": 7.0283013, "lng": 79.9417501 },
        "Dompe Pradeshiya Sabha": { "lat": 6.9496578, "lng": 80.058322 },
        "Gampaha Pradeshiya Sabha": { "lat": 7.0925595, "lng": 79.9951396 },
        "Ja-Ela Pradeshiya Sabha": { "lat": 7.0812245, "lng": 79.8911363 },
        "Minuwangoda Pradeshiya Sabha": { "lat": 7.1488266, "lng": 79.9629756 },
        "Mirigama Pradeshiya Sabha": { "lat": 7.2509324, "lng": 80.0936659 },
        "Attanagalla Pradeshiya Sabha": { "lat": 7.1138383, "lng": 80.1367665 },
        "Divulapitiya Pradeshiya Sabha": { "lat": 7.2245446, "lng": 80.0193654 }
      },
      "Kalutara": {
        "Kalutara Urban Council": { "lat": 6.5852614, "lng": 79.963301 },
        "Panadura Urban Council": { "lat": 6.7076216, "lng": 79.9369588 },
        "Horana Urban Council": { "lat": 6.6284368, "lng": 79.9874864 },
        "Beruwala Urban Council": { "lat": 6.479103, "lng": 79.9909065 },
        "Kalutara Pradeshiya Sabha": { "lat": 6.5852614, "lng": 79.963301 },
        "Panadura Pradeshiya Sabha": { "lat": 6.7076216, "lng": 79.9369588 },
        "Horana Pradeshiya Sabha": { "lat": 6.6284368, "lng": 79.9874864 },
        "Bandaragama Pradeshiya Sabha": { "lat": 6.6641188, "lng": 79.9723048 },
        "Madurawela Pradeshiya Sabha": { "lat": 6.5852614, "lng": 79.963301 },
        "Angalawatta Pradeshiya Sabha": { "lat": 6.5852614, "lng": 79.963301 },
        "Bulathsinhala Pradeshiya Sabha": { "lat": 6.6498951, "lng": 80.1780249 },
        "Dodangoda Pradeshiya Sabha": { "lat": 6.5547698, "lng": 80.0242451 },
        "Mathugama Pradeshiya Sabha": { "lat": 6.532281, "lng": 80.1107702 },
        "Walallawita Pradeshiya Sabha": { "lat": 6.3773204, "lng": 80.1965314 },
        "Beruwala Pradeshiya Sabha": { "lat": 6.479103, "lng": 79.9909065 }
      }
    },
    "North Central": {
      "Anuradhapura": {
        "Anuradhapura Municipal Council": { "lat": 8.334985, "lng": 80.4106096 },
        "Anuradhapura Pradeshiya Sabha": { "lat": 8.334985, "lng": 80.4106096 },
        "Padaviya Pradeshiya Sabha": { "lat": 8.8339506, "lng": 80.7709729 },
        "Kebithigollewa Pradeshiya Sabha": { "lat": 8.6094001, "lng": 80.5973048 },
        "Medawachchiya Pradeshiya Sabha": { "lat": 8.5387775, "lng": 80.492996 },
        "Rambewa Pradeshiya Sabha": { "lat": 8.4415315, "lng": 80.5065701 },
        "Kahatagasdigiliya Pradeshiya Sabha": { "lat": 8.42648, "lng": 80.6881685 },
        "Horowpothana Pradeshiya Sabha": { "lat": 8.5488887, "lng": 80.823273 },
        "Galenbindunuwewa Pradeshiya Sabha": { "lat": 8.2924454, "lng": 80.7189721 },
        "Mihintale Pradeshiya Sabha": { "lat": 8.3583002, "lng": 80.5121579 },
        "Nuwaragam Palatha Central Pradeshiya Sabha": { "lat": 8.3246611, "lng": 80.4118794 },
        "Nuwaragam Palatha East Pradeshiya Sabha": { "lat": 8.3246611, "lng": 80.4118794 },
        "Vilachchiya Pradeshiya Sabha": { "lat": 8.4601717, "lng": 80.1548185 },
        "Nachchaduwa Pradeshiya Sabha": { "lat": 8.3213936, "lng": 80.4188116 },
        "Noctchiyagama Pradeshiya Sabha": { "lat": 8.334985, "lng": 80.4106096 },
        "Rajanganaya Pradeshiya Sabha": { "lat": 8.1625132, "lng": 80.2173507 },
        "Galnewa Pradeshiya Sabha": { "lat": 8.0354832, "lng": 80.4802068 },
        "Thalawa Pradeshiya Sabha": { "lat": 8.2487499, "lng": 80.3547468 },
        "Ipalogama Pradeshiya Sabha": { "lat": 8.0920264, "lng": 80.5175489 },
        "Kekirawa Pradeshiya Sabha": { "lat": 8.0407932, "lng": 80.5970669 },
        "Thirappane Pradeshiya Sabha": { "lat": 8.2157151, "lng": 80.5229819 },
        "Habarana Pradeshiya Sabha": { "lat": 8.0398876, "lng": 80.7554997 },
        "Palugaswewa Pradeshiya Sabha": { "lat": 8.0635895, "lng": 80.7090898 }
      }
    },
    "Sabaragamuwa": {
      "Ratnapura": {
        "Ratnapura Municipal Council": { "lat": 6.5795685, "lng": 80.588223 },
        "Balangoda Urban Council": { "lat": 6.654957, "lng": 80.7008575 },
        "Embilipitiya Urban Council": { "lat": 6.2849429, "lng": 80.8487743 },
        "Ratnapura Pradeshiya Sabha": { "lat": 6.5795685, "lng": 80.588223 },
        "Imbulpe Pradeshiya Sabha": { "lat": 6.6945796, "lng": 80.6886713 },
        "Balangoda Pradeshiya Sabha": { "lat": 6.654957, "lng": 80.7008575 },
        "Opanayaka Pradeshiya Sabha": { "lat": 6.6783486, "lng": 80.3930267 },
        "Pelmadulla Pradeshiya Sabha": { "lat": 6.6234343, "lng": 80.5431464 },
        "Elapatha Pradeshiya Sabha": { "lat": 6.6560623, "lng": 80.3677248 },
        "Kuruvita Pradeshiya Sabha": { "lat": 6.6783486, "lng": 80.3930267 },
        "Eheliyagoda Pradeshiya Sabha": { "lat": 6.8531322, "lng": 80.2625436 },
        "Ayagama Pradeshiya Sabha": { "lat": 6.6385517, "lng": 80.3116589 },
        "Kalawana Pradeshiya Sabha": { "lat": 6.5310929, "lng": 80.3964775 },
        "Kahawatta Pradeshiya Sabha": { "lat": 6.5831751, "lng": 80.573265 },
        "Godakawela Pradeshiya Sabha": { "lat": 6.5046066, "lng": 80.6510274 },
        "Weligepola Pradeshiya Sabha": { "lat": 6.5740021, "lng": 80.7043516 },
        "Embilipitiya Pradeshiya Sabha": { "lat": 6.2849429, "lng": 80.8487743 },
        "Kolonna Pradeshiya Sabha": { "lat": 6.4012382, "lng": 80.6918168 }
      },
      "Kegalle": {
        "Kegalle Urban Council": { "lat": 7.2532006, "lng": 80.3454132 },
        "Kegalle Pradeshiya Sabha": { "lat": 7.2532006, "lng": 80.3454132 },
        "Galigamuwa Pradeshiya Sabha": { "lat": 7.2357407, "lng": 80.3102645 },
        "Warakapola Pradeshiya Sabha": { "lat": 7.2249609, "lng": 80.1965392 },
        "Ruwanwella Pradeshiya Sabha": { "lat": 7.0401198, "lng": 80.2561877 },
        "Yatiyanthota Pradeshiya Sabha": { "lat": 7.0334272, "lng": 80.2894345 },
        "Dehiowita Pradeshiya Sabha": { "lat": 6.9665597, "lng": 80.2659166 },
        "Deraniyagala Pradeshiya Sabha": { "lat": 6.9272729, "lng": 80.3385122 },
        "Karawanella Pradeshiya Sabha": { "lat": 7.023804, "lng": 80.261286 },
        "Rambukkana Pradeshiya Sabha": { "lat": 7.3239273, "lng": 80.3957479 },
        "Mawanella Pradeshiya Sabha": { "lat": 7.2488144, "lng": 80.4432718 },
        "Aranayaka Pradeshiya Sabha": { "lat": 7.2488144, "lng": 80.4432718 }
      }
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  function resolveLocation(location) {
      if (!location) return { province: "Unknown Province", district: "Unknown District", lga: "Unknown Area" };
      
      let resolvedProvince = location.province || "";
      let resolvedDistrict = location.district || "";
      let resolvedLGA = location.localGovernmentArea || "";
      
      const areaStr = (location.area || "").trim();
      const addressStr = (location.address || "").trim();
      const fallbackStr = addressStr || areaStr;
      const latitude = typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude);
      const longitude = typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude);
      
      if (!resolvedProvince || !resolvedDistrict || !resolvedLGA) {
          const matches = (search) => {
              const cleanSearch = search.toLowerCase().trim();
              if (!cleanSearch) return false;
              return fallbackStr.toLowerCase().includes(cleanSearch);
          };

          // 1. Gather all matching LGAs from address text
          const matchesList = [];
          for (const [provKey, districts] of Object.entries(sriLankaGeographics)) {
              for (const [distKey, lgas] of Object.entries(districts)) {
                  for (const lga of lgas) {
                      const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
                      if (cleanLga.length > 3 && matches(cleanLga)) {
                          matchesList.push({ lga, prov: provKey, dist: distKey, cleanLga });
                      }
                  }
              }
          }

          // 2. Sort matches by clean name length in descending order and prioritize non-district names
          if (matchesList.length > 0) {
              matchesList.sort((a, b) => {
                  const aIsDistrict = a.cleanLga === a.dist.toLowerCase();
                  const bIsDistrict = b.cleanLga === b.dist.toLowerCase();
                  if (aIsDistrict && !bIsDistrict) return 1; // push district name down
                  if (!aIsDistrict && bIsDistrict) return -1; // pull specific town name up
                  return b.cleanLga.length - a.cleanLga.length; // longer name first
              });

              resolvedProvince = matchesList[0].prov;
              resolvedDistrict = matchesList[0].dist;
              resolvedLGA = matchesList[0].lga;
          }

          // 3. If Province not matched, try to find Province via text
          if (!resolvedProvince) {
              for (const provinceKey of Object.keys(sriLankaGeographics)) {
                  const cleanProv = provinceKey.toLowerCase().replace(" province", "").trim();
                  if (matches(cleanProv)) {
                      resolvedProvince = provinceKey;
                      break;
                  }
              }
          }

          // 4. If Province found but not District, try to find District within that Province via text
          if (resolvedProvince && !resolvedDistrict) {
              for (const districtKey of Object.keys(sriLankaGeographics[resolvedProvince])) {
                  const cleanDist = districtKey.toLowerCase().replace(" district", "").trim();
                  if (matches(cleanDist)) {
                      resolvedDistrict = districtKey;
                      break;
                  }
              }
          }

          // 5. If Province still not found, try to find District anywhere via text
          if (!resolvedProvince && !resolvedDistrict) {
              for (const [provKey, districts] of Object.entries(sriLankaGeographics)) {
                  for (const distKey of Object.keys(districts)) {
                      const cleanDist = distKey.toLowerCase().replace(" district", "").trim();
                      if (matches(cleanDist)) {
                          resolvedProvince = provKey;
                          resolvedDistrict = distKey;
                          break;
                      }
                  }
                  if (resolvedDistrict) break;
              }
          }

          // 6. Fallback: If District is still not resolved, use coordinates to find the nearest District center!
          if (!resolvedDistrict && !isNaN(latitude) && !isNaN(longitude)) {
              let minDistance = Infinity;
              const targetProvinces = resolvedProvince ? [resolvedProvince] : Object.keys(sriLankaGeographics);

              for (const provKey of targetProvinces) {
                  for (const districtKey of Object.keys(sriLankaGeographics[provKey])) {
                      const center = DISTRICT_CENTERS[districtKey];
                      if (center) {
                          const dist = getDistance(latitude, longitude, center.lat, center.lng);
                          if (dist < minDistance) {
                              minDistance = dist;
                              resolvedProvince = provKey;
                              resolvedDistrict = districtKey;
                          }
                      }
                  }
              }
          }

          // 7. If we have resolved Province and District, but still no LGA, try matching LGA words/coords
          if (resolvedProvince && resolvedDistrict) {
              const lgas = sriLankaGeographics[resolvedProvince][resolvedDistrict];
              
              if (!resolvedLGA) {
                  for (const lga of lgas) {
                      const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
                      if (cleanLga.length > 3 && matches(cleanLga)) {
                          resolvedLGA = lga;
                          break;
                      }
                  }
              }

              // Try matching LGA partial words
              if (!resolvedLGA) {
                  for (const lga of lgas) {
                      const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
                      const words = cleanLga.split(/\s+/);
                      const match = words.some(word => word.length > 3 && matches(word));
                      if (match) {
                          resolvedLGA = lga;
                          break;
                      }
                  }
              }

              // 8. LGA Centroid fallback: if no LGA matched by text but we have coordinates, check distance to all LGA centers in this district
              if (!resolvedLGA && !isNaN(latitude) && !isNaN(longitude)) {
                  const districtLgas = LGA_CENTERS[resolvedProvince]?.[resolvedDistrict];
                  if (districtLgas) {
                      let minLgaDistance = Infinity;
                      let nearestLGA = "";
                      
                      for (const [lgaName, center] of Object.entries(districtLgas)) {
                          if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
                              const dist = getDistance(latitude, longitude, center.lat, center.lng);
                              if (dist < minLgaDistance) {
                                  minLgaDistance = dist;
                                  nearestLGA = lgaName;
                              }
                          }
                      }
                      
                      if (nearestLGA) {
                          resolvedLGA = nearestLGA;
                      }
                  }
              }

              // 9. Ultimate fallback: if still no LGA matched, use the first LGA in the district (usually the main city/council)
              if (!resolvedLGA && lgas.length > 0) {
                  resolvedLGA = lgas[0];
              }
          }
      }
      
      return {
          province: resolvedProvince || "Unknown Province",
          district: resolvedDistrict || "Unknown District",
          lga: resolvedLGA || "Unknown Area"
      };
  }

  async function run() {
    try {
      console.log("⚡ Connected to Firebase Admin!");
      const snap = await db.collection("reports").get();
      const lgaCounts = {};
      
      snap.forEach(doc => {
        const data = doc.data();
        const resolved = resolveLocation(data.location);
        const lgaKey = `${resolved.province} -> ${resolved.district} -> ${resolved.lga}`;
        lgaCounts[lgaKey] = (lgaCounts[lgaKey] || 0) + 1;
        
        console.log(`Report ID: ${doc.id}`);
        console.log(`  Raw Location:`, JSON.stringify(data.location, null, 2));
        console.log(`  Resolved: ${lgaKey}`);
        console.log("-----------------------------------------");
      });
      
      console.log("\nResolved LGA Distribution:");
      for (const [key, count] of Object.entries(lgaCounts)) {
        console.log(`- ${key}: ${count} report(s)`);
      }
      process.exit(0);
    } catch (error) {
      console.error("❌ Error querying reports:", error);
      process.exit(1);
    }
  }

  run();
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error);
  process.exit(1);
}
