import "./globals.css";

export const metadata = {
  title: "The 30-Day Stock Certainty System™ | Fix Stock Mismatch Permanently",
  description:
    "I fix stock mismatch in clothing stores in 30 days — permanently. No ERP. No new software. Just structure, discipline, and measurable results. Only 3 stores per month.",
  keywords:
    "stock mismatch, inventory control, clothing store, retail control, stock certainty, Aakash Savant, retail architect",
  openGraph: {
    title: "The 30-Day Stock Certainty System™",
    description:
      "Fix stock mismatch in your clothing store in 30 days — permanently.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
