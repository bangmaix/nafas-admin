const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Service Role Key:", serviceRoleKey.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin() {
  try {
    console.log("Creating admin user...");
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@nafas.id",
      password: "Admin@123456",
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return;
    }

    console.log("Auth user created:", authData.user.id);

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: "admin@nafas.id",
        full_name: "Admin NAFAS",
        role: "admin",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return;
    }

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@nafas.id");
    console.log("Password: Admin@123456");
    console.log("Profile:", profileData);
  } catch (error) {
    console.error("Error:", error);
  }
}

createAdmin();
