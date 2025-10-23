'use client'

import { Button } from "./ui/button";
import { MdOutlineCall } from "react-icons/md";
import { BsMicMute } from "react-icons/bs";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { usePeer } from "@/lib/PeerProvider";

const Callcontrol = () => {

    const { data: session, error, isPending } = useSession()
    const [isincall, setisincall] = useState(false)
    const [callduration, setcallduration] = useState(0)
    const { endCall, toggleMute, callState, isConnected, localStream } = usePeer()

    if (error) {
        console.log("Session error:", error);

    }

    useEffect(() => {


        let interval: NodeJS.Timeout | null = null;
        if (session) {
            if (callState.isInCall) {
                console.log("Call is connected, showing call control bar.");
                setisincall(true);
                setcallduration(0);
                interval = setInterval(() => {
                    setcallduration((prev) => prev + 1);
                }, 1000);
            } else {
                setisincall(false);
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };

    }, [
        session,
        callState.isInCall,
        callState.isConnecting,
        callState.callStartTime,
        callState.isMuted

    ])





    return (
        <>
            {callState.isInCall && session ? (
                <div className="sticky top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Call Status Section */}
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                                    </div>
                                    <span className="text-sm font-medium text-white">Active Call</span>
                                </div>
                                <div className="h-6 w-px bg-slate-600" />
                                <div className="font-mono text-lg font-semibold text-emerald-400 tabular-nums">
                                    {String(Math.floor(callduration / 3600)).padStart(2, '0')}:
                                    {String(Math.floor((callduration % 3600) / 60)).padStart(2, '0')}:
                                    {String(callduration % 60).padStart(2, '0')}
                                </div>
                            </div>

                            {/* Call Controls Section */}
                            <div className="flex items-center space-x-3">
                                <Button
                                    onClick={toggleMute}
                                    variant="outline"
                                    className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 transition-all duration-200 flex items-center gap-2 px-4 py-2"
                                >
                                    <BsMicMute size={18} />
                                    <span className="hidden sm:inline">{callState.isMuted ? "Unmute" : "Mute"}</span>
                                </Button>
                                <Button
                                    onClick={endCall}
                                    variant="default"
                                    className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 flex items-center gap-2 px-4 py-2 shadow-md hover:shadow-lg"
                                >
                                    <MdOutlineCall size={18} className="rotate-[135deg]" />
                                    <span className="hidden sm:inline">End Call</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {
                callState.isRinging && session ? (
                    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-lg rounded-lg">
                        <div className="px-6 py-4 flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                                <div className="absolute inset-0 w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-75" />
                            </div>
                            <span className="text-sm font-medium text-white">Ringing...</span>
                        </div>
                    </div>
                ) : null}
        </>
    );


}

export default Callcontrol;