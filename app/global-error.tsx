"use client";

/**
 * Last-resort error boundary.
 *
 * Replaces the entire document, so it must render `<html>`/`<body>` itself and
 * cannot rely on `globals.css` — hence the inline styles.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            borderRadius: "0.75rem",
            background: "#ffffff",
            padding: "2.5rem 1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            CampusCycle hit an unexpected error
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#64748b",
            }}
          >
            The application shell failed to render. Reloading the page is the
            quickest way back.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "0.5rem",
              background: "#4f46e5",
              color: "#ffffff",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
