import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const email = "7ls@doujin.com";
  const password = "112233";
  const hash = await bcrypt.hash(password, 12);

  await sql`INSERT INTO admin_users (email, password_hash) VALUES (${email}, ${hash}) ON CONFLICT (email) DO NOTHING`;
  console.log(`Admin user created: ${email}`);
}

main().catch(console.error);
