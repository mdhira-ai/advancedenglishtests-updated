'use client';
import SignUp from "@/components/auth/sign-up";
import Loading from "./loading";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const page = () => {

     const router = useRouter();
    
    
      const {
        data: session,
    
        isPending, //loading state
        error, //error object
      } = useSession();
    
      useEffect(() => {
        if (session) {
          router.replace("/profile"); // Use replace instead of push
        }
      }, [session, router]);
    
      // Show loading while checking session
      if (isPending) {
        return <Loading />;
      }
    
      // If user is already logged in, show loading while redirecting
      if (session) {
        return <Loading />;
      }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-4">

                <SignUp />
            </div>
            
        </div>

    );
}

export default page;