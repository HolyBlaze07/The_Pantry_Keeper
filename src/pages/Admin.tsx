import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Admin.css";

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [testerEmail, setTesterEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [betaTesters, setBetaTesters] = useState<
    {
      id: string;
      email: string;
      status: string;
      invited_at: string;
      joined_at: string | null;
    }[]
  >([]);

  useEffect(() => {
    async function checkAdminAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Could not check admin access:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(data));
      }

      setIsLoading(false);
    }

    void checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    void loadBetaTesters();
  }, [isAdmin]);

  async function handleInviteTester(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSending(true);
    setInviteMessage("");
    setInviteError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const response = await fetch("/api/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: testerEmail.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not send beta invitation.");
      }

      setInviteMessage(
        "Invitation and beta welcome email sent successfully!",
      );
      setTesterEmail("");
      await loadBetaTesters();
    } catch (error) {
      setInviteError(
        error instanceof Error
          ? error.message
          : "Could not send beta invitation.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function loadBetaTesters() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const response = await fetch("/api/beta-testers", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not load beta testers.");
      }

      setBetaTesters(result.testers ?? []);
    } catch (error) {
      console.error("Could not load beta testers:", error);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>Checking admin access...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <h1>Access Denied</h1>
        <p>You do not have permission to access Amealy Admin.</p>
        <a href="/">Return to Amealy</a>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">AMEALY ADMIN</p>
        <h1>Beta Tester Management</h1>

        <p>Invite a new tester to experience Amealy.</p>

        <form
          className="admin-invite-form"
          onSubmit={handleInviteTester}
        >
          <label htmlFor="tester-email">Tester Email</label>

          <input
            id="tester-email"
            type="email"
            placeholder="tester@example.com"
            value={testerEmail}
            onChange={(event) => setTesterEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send Beta Invitation"}
          </button>

          {inviteMessage && <p role="status">{inviteMessage}</p>}

          {inviteError && <p role="alert">{inviteError}</p>}
        </form>

        <section className="admin-testers">
          <div className="admin-testers__heading">
            <div>
              <p className="admin-eyebrow">BETA TESTERS</p>
              <h2>Tester List</h2>
            </div>

            <span>
              {betaTesters.length}{" "}
              {betaTesters.length === 1 ? "Tester" : "Testers"}
            </span>
          </div>

          {betaTesters.length === 0 ? (
            <div className="admin-testers__empty">
              <p>No beta testers have been recorded yet.</p>
              <p>Your next successful invitation will appear here.</p>
            </div>
          ) : (
            <div className="admin-testers__list">
              {betaTesters.map((tester) => (
                <div className="admin-tester" key={tester.id}>
                  <div>
                    <strong>{tester.email}</strong>

                    <span>
                      Invited{" "}
                      {new Date(tester.invited_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`admin-tester__status admin-tester__status--${tester.status}`}
                  >
                    {tester.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <a href="/">Return to Amealy</a>
      </section>
    </main>
  );
}
