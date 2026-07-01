// frontend/src/app/(auth)/layout.jsx
export const metadata = {
  title: {
    template: "%s | NestFind",
    default: "NestFind",
  },
  description: "Find your perfect property with NestFind",
};

export default function AuthLayout({ children }) {
  return <>{children}</>;
}
