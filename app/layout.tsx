import "./globals.css";

export const metadata = {
  title: "Vela",
  description:
    "A policy-governed AI agent that autonomously purchases API data using HBAR on Hedera.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
