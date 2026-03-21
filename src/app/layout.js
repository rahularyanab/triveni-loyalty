import "./globals.css";

export const metadata = {
  title: "Triveni Supermart — Loyalty Points",
  description: "Admin dashboard for Triveni Supermart loyalty points management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
