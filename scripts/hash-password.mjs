// scripts/hash-password.mjs
// One-time utility to generate a bcrypt hash for use in .env.local
// Usage: node scripts/hash-password.mjs yourpassword
//
// Copy the output and paste it as SUPERADMIN_PASSWORD_HASH in .env.local

import bcrypt from "bcryptjs";

const plain = process.argv[2];

if (!plain) {
  console.error("❌ Usage: node scripts/hash-password.mjs <your-password>");
  process.exit(1);
}

const hash = await bcrypt.hash(plain, 12);

console.log("\n✅ Password hash generated successfully!\n");
console.log("Add this to your .env.local file:\n");
console.log(`SUPERADMIN_PASSWORD_HASH="${hash}"`);
console.log("\n⚠️  The double quotes are REQUIRED — bcrypt hashes contain $ signs that");
console.log("    dotenv treats as variable expansions without them.");
console.log("\n⚠️  Never commit .env.local to version control!\n");
