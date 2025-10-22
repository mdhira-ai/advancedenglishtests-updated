import { useSpeakingPage } from "@/lib/SpeakingPageProvider";
import { Clock, MessageSquare, Users } from "lucide-react"
import { useMemo } from "react";


const UserStatistics = () => {

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
        <div className="flex items-center justify-start space-x-0 mb-4">
            <div className="flex items-center space-x-2  rounded-full px-3 py-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="flex items-center text-center  space-x-2 ">
                    <p className="text-sm font-bold text-blue-700">
                        {userStats.total}
                    </p>
                    <p className="text-xs text-blue-600">Total</p>
                </div>
            </div>

            <div className="flex items-center space-x-2  rounded-full px-3 py-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex items-center  text-center space-x-2">
                    <p className="text-sm font-bold text-green-700">{userStats.online}</p>
                    <p className="text-xs text-green-600">Online</p>
                </div>
            </div>

            <div className="flex items-center space-x-2 rounded-full px-3 py-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <div className="flex items-center  text-center space-x-2">
                    <p className="text-sm font-bold text-orange-700">{userStats.speaking}</p>
                    <p className="text-xs text-orange-600">Speaking</p>
                </div>
            </div>
        </div>
    );
}

export default UserStatistics;