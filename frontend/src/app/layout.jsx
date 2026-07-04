// frontend/src/app/layout.jsx
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "NestFind – Find Your Perfect Property",
  description: "Search and list real estate properties across India",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
