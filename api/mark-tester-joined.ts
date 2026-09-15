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
  if (request.method !== "POST") {
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

  if (userError || !user || !user.email) {
    return response.status(401).json({
      error: "Invalid or expired session.",
    });
  }

  const { data: tester, error: testerError } = await supabaseAdmin
    .from("beta_testers")
    .update({
      status: "joined",
      joined_at: new Date().toISOString(),
    })
    .eq("email", user.email.toLowerCase())
    .select("id")
    .maybeSingle();

  if (testerError) {
    console.error("Could not update beta tester:", testerError);

    return response.status(500).json({
      error: "Could not update beta tester status.",
    });
  }

  if (!tester) {
    return response.status(404).json({
      error: "Beta tester record not found.",
    });
  }

  return response.status(200).json({
    message: "Beta tester marked as joined.",
  });
}
