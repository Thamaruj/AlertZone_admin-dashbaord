// scripts/rebuild-regions-config.js
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../lga-coordinates-completed-all.json");
const MOBILE_TS = path.resolve(__dirname, "../../alertzone-mobile-app/config/sriLankaRegions.ts");
const DASHBOARD_TS = path.resolve(__dirname, "../lib/constants/sriLankaRegions.ts");

if (!fs.existsSync(DATA_FILE)) {
  console.error(`💥 Error: ${DATA_FILE} does not exist. Run geocode-all-country.js first.`);
  process.exit(1);
}

const lgaData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

const DISTRICT_CENTERS = {
  "Colombo": { lat: 6.9355, lng: 79.8487, province: "Western" },
  "Gampaha": { lat: 7.0899, lng: 79.9994, province: "Western" },
  "Kalutara": { lat: 6.5793, lng: 79.9648, province: "Western" },
  "Kandy": { lat: 7.2906, lng: 80.6336, province: "Central" },
  "Matale": { lat: 7.4698, lng: 80.6217, province: "Central" },
  "Nuwara Eliya": { lat: 6.9708, lng: 80.7829, province: "Central" },
  "Galle": { lat: 6.0461, lng: 80.2103, province: "Southern" },
  "Matara": { lat: 5.9485, lng: 80.5353, province: "Southern" },
  "Hambantota": { lat: 6.1234, lng: 81.1205, province: "Southern" },
  "Jaffna": { lat: 9.6685, lng: 80.0074, province: "Northern" },
  "Kilinochchi": { lat: 9.3834, lng: 80.4002, province: "Northern" },
  "Mannar": { lat: 8.9778, lng: 79.9093, province: "Northern" },
  "Vavuniya": { lat: 8.7514, lng: 80.4971, province: "Northern" },
  "Mullaitivu": { lat: 9.2236, lng: 80.7909, province: "Northern" },
  "Batticaloa": { lat: 7.7102, lng: 81.6924, province: "Eastern" },
  "Ampara": { lat: 7.2975, lng: 81.6820, province: "Eastern" },
  "Trincomalee": { lat: 8.5778, lng: 81.2289, province: "Eastern" },
  "Kurunegala": { lat: 7.4839, lng: 80.3683, province: "North Western" },
  "Puttalam": { lat: 8.0362, lng: 79.8283, province: "North Western" },
  "Anuradhapura": { lat: 8.3122, lng: 80.4131, province: "North Central" },
  "Polonnaruwa": { lat: 7.9329, lng: 81.0082, province: "North Central" },
  "Badulla": { lat: 6.9802, lng: 81.0577, province: "Uva" },
  "Moneragala": { lat: 6.8695, lng: 81.3454, province: "Uva" },
  "Ratnapura": { lat: 6.6931, lng: 80.3995, province: "Sabaragamuwa" },
  "Kegalle": { lat: 7.2515, lng: 80.3464, province: "Sabaragamuwa" }
};

const additionalCode = `
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number; province: string }> = ${JSON.stringify(DISTRICT_CENTERS, null, 2)};

export const LGA_CENTERS: Record<string, Record<string, Record<string, { lat: number; lng: number }>>> = ${JSON.stringify(lgaData, null, 2)};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
}

export function resolveSrilankaRegion(
  addressObj: any,
  fallbackAddressString: string = "",
  latitude?: number,
  longitude?: number
) {
  // Extract fields and clean them
  const region = (addressObj?.region || "").toLowerCase().trim();
  const district = (addressObj?.district || "").toLowerCase().trim();
  const subregion = (addressObj?.subregion || "").toLowerCase().trim();
  const city = (addressObj?.city || "").toLowerCase().trim();
  const name = (addressObj?.name || "").toLowerCase().trim();
  const street = (addressObj?.street || "").toLowerCase().trim();
  const fullAddress = fallbackAddressString.toLowerCase().trim();

  let resolvedProvince = "";
  let resolvedDistrict = "";
  let resolvedLGA = "";

  // Helper: check if a text contains search string as a whole word/phrase
  const escapeRegExp = (str: string) => str.replace(/[.*+?^\\$\\{}\\(\\)\\|[\\]\\\\]/g, "\\\\$&");
  const matches = (search: string) => {
    const cleanSearch = search.toLowerCase().trim();
    if (!cleanSearch) return false;
    const regex = new RegExp(\`\\\\b\${escapeRegExp(cleanSearch)}\\\\b\`, "i");
    return (
      regex.test(region) ||
      regex.test(district) ||
      regex.test(subregion) ||
      regex.test(city) ||
      regex.test(name) ||
      regex.test(street) ||
      regex.test(fullAddress)
    );
  };

  // 1. Gather all matching LGAs from address text
  const matchesList: { lga: string; prov: string; dist: string; cleanLga: string }[] = [];
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
  if (!resolvedDistrict && typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
    let minDistance = Infinity;
    // If we have resolved Province, restrict search to that province
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
        const words = cleanLga.split(/\\s+/);
        const match = words.some(word => word.length > 3 && matches(word));
        if (match) {
          resolvedLGA = lga;
          break;
        }
      }
    }

    // 8. LGA Centroid fallback: if no LGA matched by text but we have coordinates, check distance to all LGA centers in this district
    if (!resolvedLGA && typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
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

  return {
    province: resolvedProvince || "Unknown Province",
    district: resolvedDistrict || "Unknown District",
    localGovernmentArea: resolvedLGA || "Unknown Area"
  };
}
`;

function rebuildFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Warning: TS file does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  
  // Cut the content at the end of the sriLankaGeographics declaration
  const targetEndIndex = content.lastIndexOf("};");
  if (targetEndIndex === -1) {
    console.error(`💥 Error: Could not find end of sriLankaGeographics in ${filePath}`);
    return;
  }

  const baseContent = content.slice(0, targetEndIndex + 2);
  const fullContent = baseContent + "\n" + additionalCode;

  fs.writeFileSync(filePath, fullContent, "utf8");
  console.log(`✅ Rebuilt and saved config: ${filePath}`);
}

console.log("Rebuilding regions config files with all-country geocoded LGA centers...");
rebuildFile(MOBILE_TS);
rebuildFile(DASHBOARD_TS);
console.log("🎉 Rebuild complete!");
