import "./globals.css";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-svh w-full min-w-0 max-w-full flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
