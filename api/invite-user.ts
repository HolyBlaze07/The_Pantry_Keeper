import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const inviteAdminKey = process.env.AMEALY_INVITE_ADMIN_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (
	!supabaseUrl ||
	!supabaseSecretKey ||
	!inviteAdminKey ||
	!resendApiKey
) {
	throw new Error("Missing server environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false,
	},
});

const resend = new Resend(resendApiKey);

export default async function handler(request: any, response: any) {
	if (request.method !== "POST") {
		return response.status(405).json({
			error: "Method not allowed.",
		});
	}

	const providedAdminKey =
		request.headers["x-amealy-admin-key"];

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

	const testerEmail = email.trim();

	const { data, error } =
		await supabaseAdmin.auth.admin.inviteUserByEmail(
			testerEmail,
			{
				redirectTo: "https://amealy.app/set-password",
			},
		);

	if (error) {
		return response.status(400).json({
			error: error.message,
		});
	}

	const { error: welcomeEmailError } =
		await resend.emails.send({
			from: "Amealy <hello@amealy.app>",
			to: testerEmail,
			subject: "Welcome to the Amealy Beta 🍓",
			html: `
				<div style="
					background:#0d0908;
					color:#fff1d6;
					padding:40px 20px;
					font-family:Arial,sans-serif;
				">
					<div style="
						max-width:600px;
						margin:0 auto;
						background:#211512;
						border:1px solid #6d4a30;
						border-radius:18px;
						padding:32px;
					">
						<div style="
							text-align:center;
							font-size:40px;
							margin-bottom:12px;
						">
							🍓
						</div>

						<h1 style="
							text-align:center;
							color:#fff1d6;
							margin-bottom:8px;
						">
							Welcome to the Amealy Beta
						</h1>

						<p style="
							text-align:center;
							color:#d9a85f;
							font-weight:bold;
							letter-spacing:1px;
						">
							YOUR PERSONAL PANTRY
						</p>

						<p style="color:#d9c2a3; line-height:1.7;">
							Thank you for helping test Amealy!
							Your feedback will help shape the experience
							before a wider release.
						</p>

						<p style="
							color:#fff1d6;
							font-weight:bold;
							margin-top:28px;
						">
							While testing, try:
						</p>

						<ul style="
							color:#d9c2a3;
							line-height:1.9;
							padding-left:20px;
						">
							<li>Add at least 3 groceries</li>
							<li>Change a quantity</li>
							<li>Set a preferred quantity</li>
							<li>Mark an item finished</li>
							<li>Check your Shopping List</li>
							<li>Delete an item</li>
							<li>Try “What Can I Make?”</li>
							<li>Save a recipe</li>
							<li>Refresh or reopen Amealy</li>
							<li>Sign out and sign back in</li>
						</ul>

						<div style="
							text-align:center;
							margin:32px 0;
						">
							<a
								href="https://docs.google.com/forms/d/e/1FAIpQLSfa15vEaEHc4kYmntK_EprnWUCfEqdchLv2G_33pN95Us58mw/viewform?usp=dialog"
								style="
									display:inline-block;
									background:#d9a85f;
									color:#0d0908;
									text-decoration:none;
									font-weight:bold;
									padding:14px 24px;
									border-radius:10px;
								"
							>
								Give Feedback
							</a>
						</div>

						<p style="
							text-align:center;
							color:#8b7dd1;
							margin-top:32px;
						">
							Collect it. Track it. Cook it.
						</p>

						<p style="
							text-align:center;
							color:#8f8175;
							font-size:12px;
						">
							© 2026 Amealy
						</p>
					</div>
				</div>
			`,
		});

	if (welcomeEmailError) {
		return response.status(500).json({
			error:
				"Account invitation was sent, but the beta welcome email failed.",
			details: welcomeEmailError.message,
		});
	}

	return response.status(200).json({
		message:
			"Invitation and beta welcome email sent successfully.",
		userId: data.user?.id,
	});
}