import "./globals.css";

export const metadata = {
  title: "BazaarMind — AI-Powered Predictive Commerce Platform",
  description: "AI-driven predictive commerce and advisory platform for regional and rural merchants in Bangladesh. Real-time inventory advice, dynamic pricing, and hyper-local disruption alerts.",
  keywords: "BazaarMind, AI Commerce, Bangladesh, Merchant Platform, Predictive Analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
