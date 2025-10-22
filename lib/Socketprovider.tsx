'use client'

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSession } from "./auth-client";

const SocketContext = createContext<{
    socket: any;
    SignoutEmit: () => void;
} | null>(null);


export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<any>(null);
    const { data: session } = useSession();



    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string,{
            path: '/socket.io',
            secure: true,
            // Add connection options for better handling of network changes
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
        });
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on("connect", () => {
            console.log("Socket connected");
        });

        if (session?.user) {
            socket.emit("join", { userId: session.user.id });
            console.log(`User ${session.user.id} joined socket room, socket id: ${socket.id}`);
        }

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, [socket, session]);




    function SignoutEmit(){
        if (socket && session?.user) {
            socket.emit("signout", { userId: session.user.id });
            console.log(`User ${session.user.id} signed out, socket id: ${socket.id}`);
        }
    }


    return (
        <SocketContext.Provider value={{ socket, SignoutEmit }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}
