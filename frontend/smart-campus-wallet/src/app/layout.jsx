import "./globals.css";

export const metadata = {
  title: "Smart Campus Wallet",
  description: "Student-focused campus payment & wallet prototype",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
