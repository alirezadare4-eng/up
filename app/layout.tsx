import './globals.css';
export const metadata = {
  title: 'SEPEHRYARUPLOADER | سامانه دانلود و آپلود سپهریار',
  description: 'SEPEHRYARUPLOADER - سامانه فوق‌سریع آپلود و ساخت لینک دانلود مستقیم تا ۱ گیگابایت',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

