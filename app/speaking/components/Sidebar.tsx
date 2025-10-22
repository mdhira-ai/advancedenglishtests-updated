import { useSpeakingPage } from "@/lib/SpeakingPageProvider";
import { CalendarDays, Inbox, MessageSquare, Send, Users } from "lucide-react"
import { useMemo } from "react";

const Sidebar = () => {
    const { users, TotalUsersInDatabase } = useSpeakingPage();

    const userStats = useMemo(() => {
        return users.reduce(
            (acc, user) => {
                acc.total++;
                if (user.isOnline) acc.online++;
                if (user.in_room) acc.speaking++;
                return acc;
            },
            { total: 0, online: 0, speaking: 0 }
        );
    }, [users]);



    return (
        <div className="hidden lg:flex lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen">
            <div className="flex flex-col w-80 xl:w-96">
                <div className="flex flex-col h-full bg-white shadow-lg overflow-y-auto">
                    {/* Header */}
                    <div className="p-4 lg:p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="p-1.5 lg:p-2 rounded-lg" style={{ backgroundColor: '#4f5bd5' }}>
                                    <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900">Speaking Practice</h1>
                                    <p className="text-xs lg:text-sm text-gray-600">Connect & Practice</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 lg:p-6 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-3 lg:gap-4">
                            <div className="text-center p-2 lg:p-3 rounded-lg" style={{ backgroundColor: '#e8f2ff' }}>
                                <Users className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-1" style={{ color: '#1A3A6E' }} />
                                <p className="text-base lg:text-lg font-bold" style={{ color: '#1A3A6E' }}>
                                    {TotalUsersInDatabase}
                                </p>
                                <p className="text-xs text-gray-600">Available</p>
                            </div>
                            <div className="text-center p-2 lg:p-3 bg-orange-50 rounded-lg">
                                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 mx-auto mb-1" />
                                <p className="text-base lg:text-lg font-bold text-orange-700">
                                    {userStats.speaking}
                                </p>
                                <p className="text-xs text-gray-600">In Rooms</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="p-4 lg:p-6 space-y-2 lg:space-y-3">
                        {/* Incoming Requests */}
                        <button className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="p-1.5 lg:p-2 bg-red-100 rounded-lg">
                                    <Inbox className="h-4 w-4 lg:h-5 lg:w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm lg:font-medium text-gray-900">Incoming Requests</p>
                                    <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">People want to speak</p>
                                </div>
                            </div>
                        </button>

                        {/* Sent Requests */}
                        <button className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="p-1.5 lg:p-2 rounded-lg" style={{ backgroundColor: '#e8f2ff' }}>
                                    <Send className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#1A3A6E' }} />
                                </div>
                                <div>
                                    <p className="text-sm lg:font-medium text-gray-900">Sent Requests</p>
                                    <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">Waiting for response</p>
                                </div>
                            </div>
                        </button>

                        {/* Scheduled Sessions */}
                        <button className="w-full flex items-center justify-between p-2 lg:p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                                    <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm lg:font-medium text-gray-900">Scheduled Sessions</p>
                                    <p className="text-xs lg:text-sm text-gray-600 hidden lg:block">Your upcoming sessions</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;