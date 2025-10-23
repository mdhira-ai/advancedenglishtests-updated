"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "./auth-client";
import { supabase } from "./supabase";

interface UsersData {
    id: string;
    userId: string;
    isOnline: boolean;
    lastSeen: string;
    updatedAt: string;
    call_status: string | null;
    in_room: boolean;
    peerID: string ;
    room_code: string | null;
    room_created_at: string | null;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

const SpeakingPageContext = createContext<{
    fetchUsers: (page: number) => Promise<void>;
    users: UsersData[];
    loadmore: () => void;
    loading: boolean;
    hasMore: boolean;
    TotalUsersInDatabase: number;


} | null>(null);


const ITEMS_PER_PAGE = 20;

export const SpeakingPageProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { data: session } = useSession();
    const [userId, setUserId] = useState<string | null>(null);

    const [users, setUsers] = useState<UsersData[]>([]);
    // for loadmore
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [TotalUsersInDatabase, setTotalUsersInDatabase] = useState(0);

    useEffect(() => {
        if (session?.user) {
            setUserId(session.user.id);
        }
    }, [session]);


    async function TotalUsers(){

        // count total users in database
        const { count, error } = await supabase
            .from("user") // Replace with your table name
            .select("*", { count: 'exact', head: true}); // Use head: true to get only the count

           


        if (error) {
            console.error("Error fetching total users:", error.message);
            return 0;
        }
        if (count) {
            setTotalUsersInDatabase(count);
        }


    }



    const fetchUsers = async (currentPage: any) => {
        await TotalUsers();
        setLoading(true);
        const from = currentPage * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error } = await supabase
            .from("user_presence") // Replace with your table name
            .select(`*, user:userId (id, name, email, image)`) // Join with users table to get user details
            .order("isOnline", { ascending: false })
            .order("updatedAt", { ascending: false }) // Example ordering
            .range(from, to);

        if (error) {
            console.error("Error fetching items:", error.message);
        } else {
            console.log("Fetched items:", data);

            setUsers((prevItems) => {
                // Create a Set of existing IDs to avoid duplicates
                const existingIds = new Set(prevItems.map((user) => user.id));
                const newUsers = data.filter((user) => !existingIds.has(user.id));
                return [...prevItems, ...newUsers];
            });
            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false); // No more items to load
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers(0);
    }, []);


    useEffect(() => {
        const channels = supabase
            .channel("custom-all-channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "user_presence" },
                async (payload) => {
                    try {
                        if (payload.eventType === "INSERT") {
                            // Fetch the complete user data with joined user table
                            const { data, error } = await supabase
                                .from("user_presence")
                                .select(`*, user:userId (id, name, email, image)`)
                                .eq("id", (payload.new as UsersData).id)
                                .single();

                            if (!error && data) {
                                setUsers((prevUsers) => {
                                    const exists = prevUsers.some(user => user.id === data.id);
                                    if (!exists) {
                                        return [data as UsersData, ...prevUsers];
                                    }
                                    return prevUsers;
                                });
                            }
                        } else if (payload.eventType === "UPDATE") {
                            // Optimized update - only fetch if we don't have complete data
                            const updatedFields = payload.new as Partial<UsersData>;

                            setUsers((prevUsers) =>
                                prevUsers.map((user) => {
                                    if (user.id === updatedFields.id) {
                                        return { ...user, ...updatedFields };
                                    }
                                    return user;
                                })
                            );
                        } else if (payload.eventType === "DELETE") {
                            setUsers((prevUsers) =>
                                prevUsers.filter((user) => user.id !== (payload.old as UsersData).id)
                            );
                        }
                    } catch (error) {
                        console.error("Error handling real-time update:", error);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, []);

    const loadmore = () => {
        setPage((prevPage) => prevPage + 1);
        fetchUsers(page + 1);
    };





    return (
        <SpeakingPageContext.Provider value={{ fetchUsers, users, loadmore, loading, hasMore, TotalUsersInDatabase }}>
            {children}
        </SpeakingPageContext.Provider>
    );
};

export const useSpeakingPage = () => {
    const context = useContext(SpeakingPageContext);
    if (!context) {
        throw new Error('useSpeakingPage must be used within a SpeakingPageProvider');
    }
    return context;
};