import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Missing server environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default async function handler(request: any, response: any) {
  if (request.method !== "GET") {
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      error: "Unauthorized.",
    });
  }

  const accessToken = authorizationHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return response.status(401).json({
      error: "Invalid or expired session.",
    });
  }

  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) {
    return response.status(500).json({
      error: "Could not verify admin access.",
    });
  }

  if (!adminUser) {
    return response.status(403).json({
      error: "Admin access required.",
    });
  }

  const { data: testers, error: testersError } = await supabaseAdmin
    .from("beta_testers")
    .select("id, email, status, invited_at, joined_at")
    .order("invited_at", {
      ascending: false,
    });

  if (testersError) {
    return response.status(500).json({
      error: "Could not load beta testers.",
    });
  }

  return response.status(200).json({
    testers: testers ?? [],
  });
}
