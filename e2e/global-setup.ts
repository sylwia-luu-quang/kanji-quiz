import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Database } from "../src/db/database.types";

/**
 * Load environment variables from .env.test file
 */
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.test");
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
    // .env.test file doesn't exist or can't be read - that's okay if vars are set in environment
    // eslint-disable-next-line no-console
    console.log("Note: .env.test file not found or couldn't be read. Using environment variables.");
  }
}

/**
 * Global setup for Playwright tests
 * Creates a test user in Supabase before running tests
 */
async function globalSetup() {
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_KEY; // Add this for verification
  const testEmail = process.env.E2E_USERNAME || "test@example.com";
  const testPassword = process.env.E2E_PASSWORD || "testpassword123";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables.\n" +
        "Make sure you have a .env.test file with these variables or they are set in your environment.\n\n" +
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

  // eslint-disable-next-line no-console
  console.log(`Setting up test user: ${testEmail}`);

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
    user_metadata: {
      created_for_testing: true,
      created_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Test user created successfully: ${data.user.email}`);
  // eslint-disable-next-line no-console
  console.log(`   User ID: ${data.user.id}`);
  // eslint-disable-next-line no-console
  console.log(`   Email confirmed: ${data.user.email_confirmed_at ? "Yes" : "No"}`);

  // Verify the user can sign in (test with regular auth, not admin)
  const testClient = createClient<Database>(supabaseUrl, supabaseAnonKey || process.env.SUPABASE_KEY || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: signInError } = await testClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    // eslint-disable-next-line no-console
    console.error("\n⚠️  Warning: User created but cannot sign in!");
    // eslint-disable-next-line no-console
    console.error(`   Error: ${signInError.message}`);
    // eslint-disable-next-line no-console
    console.error("   This might cause E2E test failures.");
  } else {
    // eslint-disable-next-line no-console
    console.log(`✅ Verified: Test user can sign in successfully`);
  }
}

export default globalSetup;
