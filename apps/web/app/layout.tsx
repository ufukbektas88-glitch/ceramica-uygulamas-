import "./globals.css";
export const metadata = {
  title: "CERAMICA | Ticaret ve Showroom",
  description: "CERAMICA ticaret yönetimi",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
