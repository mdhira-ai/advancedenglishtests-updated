import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/others/Footer";
import Navigation from "@/components/others/Navigation";
import { PresenceProvider } from "@/lib/presence-context";
import { VisitorTrackingProvider } from "@/lib/visitor-tracking-context";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SpeakingNotificationListener from "@/components/others/SpeakingNotificationListener";
import { SocketProvider } from "@/lib/Socketprovider";
import { SpeakingPageProvider } from "@/lib/SpeakingPageProvider";
import { PeerProvider } from "@/lib/PeerProvider";
import Callcontrol from "@/components/callcontrol";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdvancedEnglishTests - IELTS & Speaking Practice",
  description: "Become a master of IELTS and English speaking with our comprehensive practice platform, featuring Cambridge books, AI-powered assessments, personalized learning paths, free practice tests, and expert guidance.",
  keywords: [
    // High-traffic SEO keywords
    "ielts practice test, free ielts practice, ielts reading practice, ielts listening practice, ielts writing tips, ielts speaking topics, free ielts mock test, ielts vocabulary words, ielts band 7 tips, online ielts practice",
    // Core IELTS and speaking practice keywords
    "IELTS preparation, IELTS speaking practice, IELTS writing practice, English speaking skills, AI speaking practice, Human speaking practice, Cambridge IELTS books, Personalized learning paths, AI-powered assessments, Comprehensive English platform, Master IELTS, Spoken English fluency, IELTS test simulation, Online English learning, Language proficiency, IELTS band improvement, Speaking with AI, Speaking with humans, Writing feedback, English conversation practice, IELTS vocabulary, Grammar practice, Pronunciation training, IELTS listening practice, IELTS reading practice, English language tests, Advanced English skills, AI English tutor, Human English tutor, Personalized English lessons, Cambridge English resources, IELTS exam tips, Fluency development, Writing task 1 practice, Writing task 2 practice, Speaking part 1 practice, Speaking part 2 practice, Speaking part 3 practice, English assessment tools, Online IELTS course, English learning platform, AI feedback system, Human interaction sessions, Cambridge practice tests, IELTS score booster, English speaking app, Writing correction service, Conversation AI, Real-time speaking practice, Adaptive learning paths, English proficiency test, IELTS mock tests, Language learning AI, Human-led speaking, Cambridge vocabulary, IELTS strategies, English fluency exercises, Personalized feedback, AI-driven learning, Human tutoring online, Cambridge grammar, IELTS speaking cues, Writing essay practice, Speaking fluency tips, English test preparation, Advanced vocabulary building, Pronunciation AI, IELTS band 7+, English speaking challenges, Writing improvement, AI conversation partner, Human conversation practice, Cambridge listening, IELTS reading strategies, English learning paths, Assessment analytics, Speaking confidence, Writing structure tips, AI English coach, Human English mentor, Cambridge writing samples, IELTS practice platform, Fluency assessment, Personalized English goals, AI-powered English, Human speaking feedback, Cambridge speaking tests, IELTS online simulator, English language mastery, Vocabulary expansion, Grammar correction AI, Speaking role plays, Writing prompt practice, IELTS success stories, English learning community, AI adaptive tests, Human-led workshops, Cambridge exam prep, IELTS holistic training, English speaking mastery"
  ],
  authors: [{ name: "AdvancedEnglishTests Team" }],
  creator: "AdvancedEnglishTests",
  publisher: "AdvancedEnglishTests",
  facebook: {
    appId: '1674735153913193',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }, // Primary for Google
      { url: 'https://d2cy8nxnsajz6t.cloudfront.net/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: 'https://d2cy8nxnsajz6t.cloudfront.net/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: 'https://d2cy8nxnsajz6t.cloudfront.net/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: 'https://d2cy8nxnsajz6t.cloudfront.net/logo.png',
    apple: [
      { url: 'https://d2cy8nxnsajz6t.cloudfront.net/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  category: 'education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>

        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JKNTYPTNX2"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JKNTYPTNX2');
            `
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0066cc" />
        <meta name="msapplication-TileColor" content="#0066cc" />
        <meta name="google-site-verification" content="Y8cuya4NH91j6f7wjIlv1246v_inAVTWB1VGN3s7Q8Q" />
        <link rel="canonical" href="https://advancedenglishtests.com" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="https://d2cy8nxnsajz6t.cloudfront.net/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="https://d2cy8nxnsajz6t.cloudfront.net/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="https://d2cy8nxnsajz6t.cloudfront.net/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />


        {/* <!-- Facebook Meta Tags --> */}
        <meta property="og:url" content="https://www.advancedenglishtests.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AdvancedEnglishTests - IELTS & Speaking Practice" />
        <meta property="og:description" content="Become a master of IELTS and English speaking with our comprehensive practice platform, featuring Cambridge books, AI-powered assessments, personalized learning paths, free practice tests, and expert guidance." />
        <meta property="og:image" content="https://www.advancedenglishtests.comhttps://d2cy8nxnsajz6t.cloudfront.net/ogimg.png" />

        {/* <!-- Twitter Meta Tags --> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="advancedenglishtests.com" />
        <meta property="twitter:url" content="https://www.advancedenglishtests.com/" />
        <meta name="twitter:title" content="AdvancedEnglishTests - IELTS & Speaking Practice" />
        <meta name="twitter:description" content="Become a master of IELTS and English speaking with our comprehensive practice platform, featuring Cambridge books, AI-powered assessments, personalized learning paths, free practice tests, and expert guidance." />
        <meta name="twitter:image" content="https://www.advancedenglishtests.comhttps://d2cy8nxnsajz6t.cloudfront.net/ogimg.png" />



      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <Toaster position="top-center" />
        <ToastContainer />

        <VisitorTrackingProvider>
          <SpeakingPageProvider>
            <SocketProvider>
              <PeerProvider>

                <Callcontrol />
                {/* <PresenceProvider> */}
                <SpeakingNotificationListener />
                <Navigation />
                {children}

                <Analytics />

                <Footer />
                {/* </PresenceProvider> */}
              </PeerProvider>

            </SocketProvider>
          </SpeakingPageProvider>
        </VisitorTrackingProvider>

      </body>
    </html>
  );
}
