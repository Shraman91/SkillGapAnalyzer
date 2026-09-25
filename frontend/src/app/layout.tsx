import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Skill Gap Analyzer",
  description: "Identify skill gaps and generate personalized learning roadmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-violet-50 dark:bg-[#0f0a1a] text-violet-950 dark:text-violet-100 min-h-screen transition-colors`}>
        <AuthProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />

              <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
                {children}
              </main>

              <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} AI Skill Gap Analyzer. Built with LangGraph & Next.js.
              </footer>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
