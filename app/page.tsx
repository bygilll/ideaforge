"use client";

import { useState } from "react";

export type ValidationPlan = {
  problem: string;
  targetCustomer: string;
  mvp: string;
  validationPlan: string;
};

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ValidationPlan | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.headline}>
          Turn your startup idea into a 14-day validation plan
        </h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea in a few sentences..."
            rows={5}
            style={styles.textarea}
            disabled={loading}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Generating..." : "Generate Plan"}
          </button>
        </form>

        {error && (
          <p style={styles.error} role="alert">
            {error}
          </p>
        )}

        {plan && (
          <div style={styles.results}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>1. Problem</h2>
              <p style={styles.sectionBody}>{plan.problem}</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>2. Target Customer</h2>
              <p style={styles.sectionBody}>{plan.targetCustomer}</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>3. MVP</h2>
              <p style={styles.sectionBody}>{plan.mvp}</p>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>4. 14-Day Validation Plan</h2>
              <p style={styles.sectionBody}>{plan.validationPlan}</p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
  },
  headline: {
    fontSize: "1.75rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    lineHeight: 1.3,
    color: "#111",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    color: "#fff",
    background: "#111",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  error: {
    color: "#c00",
    marginBottom: "1rem",
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  section: {
    padding: "1.25rem",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#333",
  },
  sectionBody: {
    fontSize: "0.95rem",
    color: "#444",
    whiteSpace: "pre-wrap",
  },
};
