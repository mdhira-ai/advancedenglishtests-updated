
import { CalendarDays, Inbox, Send, Users } from "lucide-react"


const MobileBottomNavigation = () => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
                        <div className="grid grid-cols-4 ">
                            {/* Incoming Requests */}
                            <button className="flex flex-col items-center py-3 sm:py-3 px-2 text-center relative transition-colors text-red-600 hover:bg-gray-50 active:bg-gray-100">
                                <div className="relative">
                                    <Inbox className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                                </div>
                                <span className="text-xs hidden sm:block">Requests</span>
                            </button>

                            {/* Active Users / Home */}
                            <button
                                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                style={{ color: '#1A3A6E' }}
                            >
                                <div className="relative">
                                    <Users className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                                    <div className="absolute -top-2 sm:-top-2 -right-2 sm:-right-2 min-w-5 h-5 sm:min-w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-bold px-1.5 py-0.5" style={{ backgroundColor: '#4f5bd5' }}>
                                        0
                                    </div>
                                </div>
                                <span className="text-xs hidden sm:block">Users</span>
                            </button>

                            {/* Scheduled Sessions */}
                            <button className="flex flex-col items-center py-3 sm:py-3 px-2 text-center text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                <div className="relative">
                                    <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                                </div>
                                <span className="text-xs hidden sm:block">Schedule</span>
                            </button>

                            {/* Sent Requests */}
                            <button
                                className="flex flex-col items-center py-3 sm:py-3 px-2 text-center relative transition-colors hover:bg-gray-50 active:bg-gray-100"
                                style={{ color: '#1A3A6E' }}
                            >
                                <div className="relative">
                                    <Send className="h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1" />
                                </div>
                                <span className="text-xs hidden sm:block">Sent</span>
                            </button>
                        </div>
                    </div>
    );
}

export default MobileBottomNavigation;