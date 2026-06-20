import './globals.css';

export const metadata = {
  title: 'CyberDiary',
  description: 'サイバーパンク風AI日記アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
