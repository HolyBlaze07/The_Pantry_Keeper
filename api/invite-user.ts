import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const inviteAdminKey = process.env.AMEALY_INVITE_ADMIN_KEY;

if (!supabaseUrl || !supabaseSecretKey || !inviteAdminKey) {
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

	const providedAdminKey = request.headers["x-amealy-admin-key"];

	if (providedAdminKey !== inviteAdminKey) {
		return response.status(401).json({
			error: "Unauthorized.",
		});
	}

	const { email } = request.body ?? {};

	if (!email || typeof email !== "string") {
		return response.status(400).json({
			error: "A valid email address is required.",
		});
	}

	const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
		email.trim(),
		{
			redirectTo: "https://amealy.app/set-password",
		},
	);

	if (error) {
		return response.status(400).json({
			error: error.message,
		});
	}

	return response.status(200).json({
		message: "Invitation sent successfully.",
		userId: data.user?.id,
	});
}
