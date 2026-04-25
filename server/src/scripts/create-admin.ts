import 'dotenv/config';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

type CliArgs = {
  email?: string;
  password?: string;
  name?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const getArg = (key: string) => {
    const idx = argv.findIndex((arg) => arg === `--${key}`);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  return {
    email: getArg('email'),
    password: getArg('password'),
    name: getArg('name'),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const { email, password, name } = parseArgs(process.argv.slice(2));

  if (!email || !password) {
    console.error(
      'Usage: npm run create-admin -- --email admin@example.com --password "YourStrongPassword" [--name "Admin Name"]'
    );
    process.exit(1);
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE');

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = name ?? 'System Admin';

  const adminPayload = {
    full_name: fullName,
    email,
    password: hashedPassword,
    role: 'admin',
    position: 'Administrator',
    is_active: true,
  };

  let result = await supabase
    .from('employees')
    .upsert(adminPayload, { onConflict: 'email' })
    .select('*')
    .single();

  if (result.error && /column .* does not exist/i.test(result.error.message)) {
    const fallbackPayload = {
      full_name: fullName,
      email,
      password: hashedPassword,
      position: 'Administrator',
    };

    result = await supabase
      .from('employees')
      .upsert(fallbackPayload, { onConflict: 'email' })
      .select('*')
      .single();
  }

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to create admin account');
  }

  console.log('Admin account is ready:');
  console.log(`- id: ${result.data.id}`);
  console.log(`- email: ${result.data.email}`);
  console.log(`- full_name: ${result.data.full_name}`);
  console.log(`- role: ${result.data.role ?? 'N/A (column not available)'}`);
}

main().catch((error) => {
  console.error('Create admin failed:', error.message);
  process.exit(1);
});
