"use client";

import { Button } from "@/components/ui/button";
import { useSpeakingPage } from "@/lib/SpeakingPageProvider";
import { Clock, MessageSquare, Users } from "lucide-react";
import UserStatistics from "./UserStatistics";
import Image from "next/image";
import dayjs from "dayjs"; // ES 2015
import relativeTime from "dayjs/plugin/relativeTime"; // ES 2015
import { useSession } from "@/lib/auth-client";
import { useEffect, useMemo } from "react";
import ConnectBtn from "./ConnectBtn";
import Schedulebtn from "./Schedulebtn";
dayjs.extend(relativeTime);
dayjs().format();

const UsersGrid = () => {
    const { users, fetchUsers } = useSpeakingPage();

    const { data: session, error, isPending } = useSession()

    const sortedUsers = useMemo(() => {
        return users.sort((a, b) => {
            // Current user first
            if (a.user?.id === session?.user?.id) return -1;
            if (b.user?.id === session?.user?.id) return 1;

            // Online users before offline
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;

            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    }, [users, session?.user?.id]);







    return (
        <div className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4 lg:mb-6">
                    <div className="flex items-center justify-between mb-1 lg:mb-2">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                            All Users
                        </h2>
                    </div>
                    <p className="text-sm lg:text-base text-gray-600 mb-3">
                        Connect with people worldwide to practice and enhance your speaking
                        skills. Your profile is shown first, followed by users sorted by
                        recent activity.
                    </p>

                    {/* User Statistics Summary */}
                    <UserStatistics />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-4">
                    {/* Sample User Card */}

                    {sortedUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                        >
                            {/* Header with Avatar and Name */}
                            <div className="p-3 text-center relative">
                                {/* Avatar */}
                                <div className="relative inline-block mb-2">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50">
                                        {/* Gender icon placeholder */}
                                        {/* <div className="w-8 h-8 bg-blue-200 rounded-full"></div> */}
                                        {user.user?.image ? (
                                            <Image
                                                src={user.user?.image}
                                                width={56}
                                                height={56}
                                                alt="Avatar"
                                                className="w-14 h-14 rounded-full object-cover"
                                            />
                                        ) : (
                                            <Users className="h-8 w-8 text-blue-400" />
                                        )}
                                    </div>

                                    {/* Status dot */}
                                    {user.isOnline ? (
                                        <>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-green-400"></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-gray-400"></div>
                                        </>
                                    )}
                                </div>

                                {/* Name */}
                                <h3 className="text-sm font-medium text-gray-900 leading-tight mb-1">
                                    {user.user?.name || "Unnamed User"}
                                </h3>

                                {/* Gender */}
                                <p className="text-xs text-gray-600 mb-1">Male</p>

                                {/* Status Text */}
                                {user.isOnline ? (
                                    <div className="text-xs text-green-600 font-semibold">
                                        Online
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 font-semibold">
                                        Offline
                                    </div>
                                )}

                                {/* Last Seen */}
                                {!user.isOnline && (
                                    <div className="text-xs text-gray-400">
                                        Last seen: {dayjs(user.lastSeen).fromNow()}
                                    </div>
                                )}

                                {/* User Statistics */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-blue-600">
                                                0
                                            </span>
                                            <span className="text-xs text-gray-500">min</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-pink-600">
                                                0
                                            </span>
                                            <span className="text-xs text-gray-500">likes</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-green-600">
                                                0
                                            </span>
                                            <span className="text-xs text-gray-500">talks</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="p-3 pt-2">
                                <div className="space-y-2">


                                    {user.user?.id !== session?.user?.id && (
                                        user.isOnline ? ( 
                                            <ConnectBtn
                                                remotePeerId={user.peerID}
                                                remoteUserId={user.user?.id}

                                            />
                                        ) : (
                                            <Schedulebtn userDetails={user}/>
                                        )
                                    )}



                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UsersGrid;
