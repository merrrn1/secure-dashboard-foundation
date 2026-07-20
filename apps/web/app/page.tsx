"use client";

import { type FormEvent, useState } from "react";
import { useSessionStore } from "@/store/session";

const statusLabels = {
  healthy: "Healthy",
  attention: "Needs attention",
  offline: "Offline",
};

export default function Home() {
  const [email, setEmail] = useState("operator@example.com");
  const [password, setPassword] = useState("local-demo-password");
  const session = useSessionStore();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await session.signIn(email, password);
  }

  if (!session.user) {
    return (
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">Integration sample</span>
          <h1>Replace mock state with a secure product foundation.</h1>
          <p>Next.js and Zustand on the client. Express, MongoDB and short-lived JWT access on the server.</p>
          <ul>
            <li>Explicit loading, error and empty states</li>
            <li>Validated authentication and protected routes</li>
            <li>Docker setup, tests and handover notes</li>
          </ul>
        </section>

        <form className="card login" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Operator access</span>
            <h2>Sign in</h2>
            <p className="muted">The demo token stays in memory and expires after 15 minutes.</p>
          </div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          {session.error && <p className="error" role="alert">{session.error}</p>}
          <button disabled={session.authState === "loading"} type="submit">
            {session.authState === "loading" ? "Signing in…" : "Open dashboard"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Secure operations</span>
          <h1>System overview</h1>
        </div>
        <div className="identity">
          <span>{session.user.email}</span>
          <button className="secondary" onClick={session.signOut}>Sign out</button>
        </div>
      </header>

      {session.dashboardState === "loading" && <section className="card state">Loading live data…</section>}
      {session.dashboardState === "error" && (
        <section className="card state error">
          <p>{session.error}</p>
          <button onClick={() => session.loadDashboard()}>Retry</button>
        </section>
      )}
      {session.dashboardState === "ready" && session.rows.length === 0 && (
        <section className="card state">No services have been connected yet.</section>
      )}
      {session.rows.length > 0 && (
        <section className="grid" aria-label="Connected services">
          {session.rows.map((row) => (
            <article className="card service" key={row.id}>
              <div className={`status ${row.status}`}>{statusLabels[row.status]}</div>
              <h2>{row.name}</h2>
              <p className="muted">Updated {new Date(row.updatedAt).toLocaleString()}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

