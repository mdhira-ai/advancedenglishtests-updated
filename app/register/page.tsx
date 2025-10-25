"use client";
import SignUp from "@/components/auth/sign-up";
import Loading from "./loading";
import { useSession } from "@/lib/auth-client";
import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();

  const {
    data: session,

    isPending, //loading state
    error, //error object
  } = useSession();

  useEffect(() => {
    if (session && !isPending) {
      router.replace("/profile"); // Use replace instead of push
    }
  }, [session, router, isPending]);

  // Show loading while checking session
  if (isPending) {
    return <Loading />;
  }

  if (session) return null; // Already logged in, no need to show sign-up form

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <SignUp />
      </div>
    </div>
  );
};

export default page;
