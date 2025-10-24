"use client";

import { Mic } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MobileBottomNavigation from "./components/MobileBottomNavigation";
import UsersGrid from "./components/UsersGrid";
import { Button } from "@/components/ui/button";
import { useSpeakingPage } from "@/lib/SpeakingPageProvider";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Loading from "./loading";

const page = () => {
    const { users, loadmore, loading, hasMore } = useSpeakingPage();
    const { data: session, isPending, error } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!session) {
            router.replace("/login"); // Use replace instead of push
        }
    }, [session, router]);

    if (isPending) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-red-500 font-medium">Error: {error.message}</p>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex lg:min-h-screen">
                {/* Sidebar - Hidden on mobile */}
                {/* <Sidebar /> */}

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 lg:w-0">
                    <div className="flex-1 bg-gray-50 lg:static relative pb-16 sm:pb-20 lg:pb-0">
                        {/* Motivational Quote Banner */}
                        <div className="p-3 sm:p-4 lg:p-6 pb-0">
                            <div className="max-w-6xl mx-auto mb-4 lg:mb-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 lg:p-6 text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Mic className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 mr-2" />
                                        <span className="text-blue-600 font-semibold text-sm lg:text-base">
                                            Start Your Speaking Journey
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm lg:text-base font-medium mb-1">
                                        "Don't waste your time! Send a connect request or schedule a
                                        session to start speaking practice."
                                    </p>
                                    <p className="text-blue-600 text-xs lg:text-sm font-semibold">
                                        🚀 Your first step will boost your speaking confidence!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Users Grid */}
                        <UsersGrid />
                    </div>

                    {/* Mobile Bottom Navigation - Visible on mobile only */}
                    <MobileBottomNavigation />

                    {/* make load more button */}

                    {loading && (
                        <div className="flex justify-center mt-4">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    )}

                    {users.length > 0 && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                className="w-full max-w-xs"
                                onClick={loadmore}
                                disabled={loading || !hasMore}
                            >
                                Load More
                            </Button>
                        </div>
                    )}

                    {!hasMore && (
                        <div className="flex justify-center mt-4 mb-4">
                            <p className="text-gray-500">No more users to load.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default page;
