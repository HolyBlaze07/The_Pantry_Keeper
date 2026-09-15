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
				<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
				<html dir="ltr" lang="en">
				<head>
					<meta content="width=device-width" name="viewport"/>
					<meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
					<meta name="x-apple-disable-message-reformatting"/>
					<meta content="IE=edge" http-equiv="X-UA-Compatible"/>
					<meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/>
					<style>
						@media (prefers-color-scheme: dark) {
							li::marker { color:#c4c4c4; }
						}
					</style>
				</head>
				<body dir="ltr" lang="en" style="background-color:#09070f;margin:0;padding:0;">
				<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
				<tbody><tr><td dir="ltr" lang="en" style="background-color:#09070f;margin:0;padding:0;">
				<table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#09070f;border-radius:0;">
				<tbody><tr style="width:100%"><td style="padding:0">
				<div style="margin:0;padding:56px 20px;background-color:#09070f;background-image:linear-gradient(rgba(139,125,209,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(139,125,209,.07) 1px,transparent 1px),radial-gradient(circle 500px at 50% 180px,rgba(139,125,209,.55),rgba(113,101,181,.30) 28%,rgba(81,70,126,.14) 48%,rgba(9,7,15,0) 72%);background-size:32px 32px,32px 32px,100% 100%;color:#FFF1D6;font-family:Arial,Helvetica,sans-serif;">
				<div style="margin:auto;padding:44px 36px;max-width:560px;background:#0D0912;border:1px solid #51467E;border-radius:22px;text-align:center;">
				<div style="margin:0;padding:0;font-size:40px;margin-bottom:16px;"><p style="margin:0;padding:0">🍓</p></div>
				<h1 style="margin:0 0 8px;padding:0;color:#FFF1D6;font-family:'Gorditas','Trebuchet MS',Arial,sans-serif;font-size:34px;">Welcome to the Amealy Beta</h1>
				<p style="margin:0 0 28px;padding:0;color:#E6C27A;font-size:12px;font-weight:bold;letter-spacing:2.5px;">YOUR PERSONAL PANTRY</p>
				<p style="margin:1em 0;padding:0;color:#FFF1D6;font-family:'Gorditas','Trebuchet MS',Arial,sans-serif;font-size:18px;">Thank you for helping me test Amealy!</p>
				<p style="margin:0 auto 28px;padding:0;max-width:455px;color:#D9C2A3;font-size:15px;line-height:1.7;">You should receive a separate invitation email from Amealy. Click <strong>Accept Invitation</strong>, create your password, and you'll be taken into your own personal pantry.</p>
				<div style="margin:0 auto 30px;padding:24px;max-width:455px;text-align:left;background:#151020;border:1px solid #51467E;border-radius:14px;">
				<p style="margin:0 0 15px;padding:0;color:#E6C27A;font-size:12px;font-weight:bold;letter-spacing:1.8px;">WHILE YOU'RE TESTING</p>
				<p style="margin:0;padding:0;color:#D9C2A3;font-size:14px;line-height:1.85;">✓ Add at least 3 groceries<br/>✓ Change a quantity<br/>✓ Set a preferred quantity<br/>✓ Mark an item finished<br/>✓ Check your Shopping List<br/>✓ Delete an item<br/>✓ Try <strong>What Can I Make?</strong><br/>✓ Save a recipe<br/>✓ Refresh or reopen Amealy<br/>✓ Sign out and sign back in</p>
				</div>
				<p style="margin:0 auto 30px;padding:0;max-width:455px;color:#D9C2A3;font-size:14px;line-height:1.7;">Don't worry about doing everything “correctly.” I want to know what feels intuitive, what feels confusing, what you expected to happen, and anything that doesn't work.</p>
				<p style="margin:0;padding:0"><a href="https://docs.google.com/forms/d/e/1FAIpQLSfa15vEaEHc4kYmntK_EprnWUCfEqdchLv2G_33pN95Us58mw/viewform?usp=dialog" rel="noopener noreferrer nofollow" target="_blank" style="color:#0D0908;text-decoration:none;display:inline-block;background:#D9A85F;font-size:16px;font-weight:bold;padding:15px 32px;border-radius:10px;">Give Feedback</a></p>
				<div style="margin:36px auto 24px;padding:0;width:64px;height:1px;background:#51467E;"></div>
				<p style="margin:0 0 8px;padding:0;font-family:'Gorditas','Trebuchet MS',Arial,sans-serif;font-size:15px;">Collect it. Track it. Cook it.</p>
				<p style="margin:0 0 18px;padding:0;color:#8B7DD1;font-size:12px;">Made for a smarter pantry.</p>
				<p style="margin:0;padding:0;color:#8F7965;font-size:11px;">© 2026 Amealy. All rights reserved.</p>
				</div></div>
				</td></tr></tbody></table>
				</td></tr></tbody></table>
				</body>
				</html>
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