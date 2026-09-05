import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ChatWidget } from '@/components/chat-widget';
import { SmartErrorBoundary } from '@/components/smart-error-boundary';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'Balatasan Stay | Eco-Resort Booking',
  description: 'Book your eco-friendly tropical getaway at Balatasan Beach Resort.',
  manifest: '/manifest.json',
  themeColor: '#12AFAB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Balatasan',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SmartErrorBoundary context="Balatasan booking website">
            {children}
            <Toaster />
            <FirebaseErrorListener />
            <ChatWidget />
          </SmartErrorBoundary>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
