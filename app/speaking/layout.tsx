"use client";

import Sidebar from "./components/Sidebar";
import MobileBottomNavigation from "./components/MobileBottomNavigation";

export default function SpeakingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex lg:min-h-screen">
                <Sidebar />
                <div className="flex flex-col flex-1 lg:w-0">
                    <div className="flex-1 bg-gray-50 lg:static relative pb-16 sm:pb-20 lg:pb-0">
                        {children}
                    </div>
                </div>
                <MobileBottomNavigation />
            </div>
        </div>
    );
}