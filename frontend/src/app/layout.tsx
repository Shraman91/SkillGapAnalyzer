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
      <body
        className={`${inter.className} antialiased bg-slate-50 dark:bg-black text-slate-900 dark:text-white min-h-screen transition-colors`}
      >
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen">
              {/* Sidebar */}
              <Navbar />

              {/* Main Area */}
              <div className="min-h-screen pl-64">
                <main className="min-h-[calc(100vh-65px)] w-full p-6 md:p-8">
                  {children}
                </main>

                {/* Footer */}
                <footer className="border-t border-blue-100 bg-white py-5 text-center text-xs text-slate-500 dark:border-purple-900/60 dark:bg-black dark:text-slate-400">
                  &copy; {new Date().getFullYear()} AI Skill Gap Analyzer.
                  Built with LangGraph & Next.js.
                </footer>
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}