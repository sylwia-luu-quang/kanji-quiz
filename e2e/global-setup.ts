import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Database } from "../src/db/database.types";

/**
 * Load environment variables from .env file
 */
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const envFile = readFileSync(envPath, "utf-8");

    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  } catch {
    // .env file doesn't exist or can't be read - that's okay if vars are set in environment
    // eslint-disable-next-line no-console
    console.log("Note: .env file not found or couldn't be read. Using environment variables.");
  }
}

/**
 * Global setup for Playwright tests
 * Creates a test user in Supabase before running tests
 */
async function globalSetup() {
  // Load .env file
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables.\n" +
        "Make sure you have a .env file with these variables or they are set in your environment.\n\n" +
        `Current values:\n` +
        `  SUPABASE_URL: ${supabaseUrl ? "✓ set" : "✗ missing"}\n` +
        `  SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? "✓ set" : "✗ missing"}`
    );
  }

  // Create admin client with service key to bypass RLS
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = "test@example.com";
  const testPassword = "testpassword123";

  // eslint-disable-next-line no-console
  console.log("Setting up test user...");

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((user) => user.email === testEmail);

  if (existingUser) {
    // eslint-disable-next-line no-console
    console.log("Test user already exists, deleting...");
    await supabase.auth.admin.deleteUser(existingUser.id);
  }

  // Create new test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Auto-confirm email
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Test user created successfully: ${data.user.email}`);
}

export default globalSetup;
