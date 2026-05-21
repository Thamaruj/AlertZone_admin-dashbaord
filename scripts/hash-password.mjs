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

// Next.js dotenv expands $VAR references. Escape every $ with \$ so the
// bcrypt hash is treated as a literal value.
const escaped = hash.replace(/\$/g, "\\$");

console.log("\n✅ Password hash generated successfully!\n");
console.log("Add this line to your .env.local file:\n");
console.log(`SUPERADMIN_PASSWORD_HASH=${escaped}`);
console.log("\n⚠️  The \\$ escaping is REQUIRED — Next.js treats bare $ as variable");
console.log("    expansion. See: https://nextjs.org/docs/app/guides/environment-variables");
console.log("\n⚠️  Never commit .env.local to version control!\n");
