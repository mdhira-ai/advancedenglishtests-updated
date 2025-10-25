"use client";

import { sendWelcomeEmail } from "@/lib/auth";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const page = () => {
  const router = useRouter();
  const { data: session, error, isPending } = useSession();
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!session && !isPending) {
      const currentPath = window.location.pathname;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isPending, router]);



  useEffect(() => {
    if (session && !emailSent) {
      sendWelcomeEmail({
        to: session.user.email!,
        name: session.user.name || "there",
      });
      setEmailSent(true);
    }
  }, [session, emailSent]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground mb-3">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">{error.message}</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-card border border-border rounded-lg p-6 sm:p-10">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-card-foreground mb-2">
              Welcome to Advanced English Tests! 👋
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {session.user.name ? `Hi ${session.user.name}, ` : ""}Your account has been created successfully
            </p>
          </div>

          {/* User Info */}
          <div className="bg-muted rounded-md p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Account Email</p>
            <p className="text-card-foreground font-medium break-all">
              {session.user.email}
            </p>
            {emailSent && (
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Welcome email sent to your inbox
              </p>
            )}
          </div>

          {/* Quick Start Guide */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Get Started
            </h2>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex gap-3">
                <span className="text-primary font-semibold">1.</span>
                <p className="text-muted-foreground flex-1">
                  Take Cambridge IELTS practice tests
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-semibold">2.</span>
                <p className="text-muted-foreground flex-1">
                  Practice speaking and writing skills
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-semibold">3.</span>
                <p className="text-muted-foreground flex-1">
                  Track your progress and improve
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/profile"
              className="flex-1 text-center px-6 py-3 bg-[#1A3A6E]  text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/cambridge"
              className="flex-1 text-center px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium"
            >
              Start Practice
            </Link>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-muted-foreground text-xs sm:text-sm mt-6">
          Need help?{" "}
          <Link href="/about" className="text-primary hover:underline">
            Learn more about our platform
          </Link>
        </p>
      </div>
    </div>
  );
};

export default page;
