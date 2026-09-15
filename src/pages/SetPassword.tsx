import { useState } from "react";
import { supabase } from "../lib/supabase";

export function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  return (
    <main className="auth-page">
      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <p className="auth-eyebrow">Amealy Account</p>

          <h1>Set your password</h1>

          <p>Create a password to finish setting up your Amealy account.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating password..." : "Set Password"}
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
