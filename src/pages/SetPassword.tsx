import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(true);
  const [inviteIsValid, setInviteIsValid] = useState(false);

  useEffect(() => {
    async function verifyInvitation() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      try {
        // New custom Amealy invitation link
        if (tokenHash && type === "invite") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });

          if (error) {
            throw error;
          }

          setInviteIsValid(true);

          // Remove the token from the address bar after verification.
          window.history.replaceState(
            {},
            document.title,
            "/set-password",
          );

          return;
        }

        // Fallback: allow the page if Supabase already established
        // a valid authenticated session.
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          setInviteIsValid(true);
          return;
        }

        setMessage(
          "This invitation link is invalid or has expired. Please request a new invitation.",
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not verify your invitation.",
        );
      } finally {
        setIsVerifyingInvite(false);
      }
    }

    verifyInvitation();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setMessage("Password created successfully!");

      window.setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create your password.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifyingInvite) {
    return (
      <main className="auth-page">
        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <p className="auth-eyebrow">Amealy Account</p>
            <h1>Accepting your invitation...</h1>
            <p>Please wait while Amealy verifies your invitation.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!inviteIsValid) {
    return (
      <main className="auth-page">
        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <p className="auth-eyebrow">Amealy Account</p>
            <h1>Invitation unavailable</h1>

            <p className="auth-message" role="status">
              {message}
            </p>

            <a href="/">Return to Amealy</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <p className="auth-eyebrow">Amealy Account</p>

          <h1>Set your password</h1>

          <p>
            Create a password to finish setting up your Amealy account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={6}
                required
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={6}
                required
              />
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Creating password..."
                : "Set Password"}
            </button>
          </form>

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}