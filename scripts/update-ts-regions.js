// scripts/update-ts-regions.js
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

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Warning: TS file does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  
  // Format the LGA_CENTERS constant nicely
  const formattedData = JSON.stringify(lgaData, null, 2);
  const replacement = `export const LGA_CENTERS: Record<string, Record<string, Record<string, { lat: number; lng: number }>>> = ${formattedData};`;

  // Find the start index
  const startKeyword = "export const LGA_CENTERS: Record<string, Record<string, Record<string, { lat: number; lng: number }>>> = {";
  const startIndex = content.indexOf(startKeyword);

  if (startIndex === -1) {
    console.error(`💥 Error: Could not find LGA_CENTERS declaration start in ${filePath}`);
    return;
  }

  // Find the end index. Since LGA_CENTERS is followed by getDistance function, find the end before it.
  const endKeyword = "function getDistance(";
  const endIndex = content.indexOf(endKeyword, startIndex);

  if (endIndex === -1) {
    console.error(`💥 Error: Could not find getDistance function after LGA_CENTERS in ${filePath}`);
    return;
  }

  // Locate the closing bracket }; before the getDistance function
  const substringBeforeDistance = content.slice(startIndex, endIndex);
  const lastClosingBrace = substringBeforeDistance.lastIndexOf("};");

  if (lastClosingBrace === -1) {
    console.error(`💥 Error: Could not find closing brace }; for LGA_CENTERS in ${filePath}`);
    return;
  }

  const absoluteEndIndex = startIndex + lastClosingBrace + 2; // include the semicolon

  const newContent = content.slice(0, startIndex) + replacement + "\n\n" + content.slice(absoluteEndIndex);
  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`✅ Successfully updated LGA_CENTERS in: ${filePath}`);
}

console.log("Updating TS config files with full country LGA coordinates...");
updateFile(MOBILE_TS);
updateFile(DASHBOARD_TS);
console.log("🎉 TS configs update complete!");
