"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";


interface NotificationType {
  notificationId: number;
  type: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  actorId: string;
  sessionId?: number;
  actor: {
    id: string;
    name: string;
    image?: string;
  };
  schedule_sessions: {
    id: number;
    scheduled_at_utc: string;
    booker_timezone: string;
    participant_id: string;
    booker_id: string;
    status: string;

  };
}

interface NotificationsContextType {
  notifications: NotificationType[];
  unreadCount: number;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | null>(
  null
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("Notifications")
      .select(
        `
        *,
        actor:user!Notifications_actorId_fkey(id, name, image),
        schedule_sessions:schedule_sessions(id, scheduled_at_utc, booker_timezone, participant_id, booker_id,status)
      `
      )
      .eq("userId", session.user.id)
      .order("createdAt", { ascending: false })
      .limit(50);

    if (data) {
      console.log("Fetched notifications:", data);
    }


    if (!error && data) {
      setNotifications(data as NotificationType[]);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: number) => {
    const { error } = await supabase
      .from("Notifications")
      .update({ isRead: true })
      .eq("notificationId", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("Notifications")
      .update({ isRead: true })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  // ...existing code...
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Notifications",
            filter: `userId=eq.${session.user.id}`,
          },
          async (payload) => {
            console.log("Notification event:", payload); // Add this for debugging

            // Fetch the complete notification with related data
            if (payload.eventType === "INSERT") {
              const { data } = await supabase
                .from("Notifications")
                .select(
                  `
            *,
            actor:user!Notifications_actorId_fkey(id, name, image),
            schedule_sessions:schedule_sessions(id, scheduled_at_utc, booker_timezone, participant_id, booker_id,status)
          `
                )
                .eq("notificationId", (payload.new as any).notificationId)
                .single();

              if (data) {
                console.log("New notification received:", data);
                setNotifications((prev) => [data as NotificationType, ...prev]);
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Notification updated:", payload.new);
              const updatedNotification = payload.new as NotificationType;
              const { data } = await supabase
                .from("Notifications")
                .select(
                  `
            *,
            actor:user!Notifications_actorId_fkey(id, name, image),
            schedule_sessions:schedule_sessions(id, scheduled_at_utc, booker_timezone, participant_id, booker_id,status)
          `
                )
                .eq("notificationId", updatedNotification.notificationId)
                .single();

              if (data) {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.notificationId === updatedNotification.notificationId
                      ? { ...n, ...data }
                      : n
                  )
                );
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Notification deleted:", payload.old);
              const deletedNotification = payload.old as any;
              setNotifications((prev) =>
                prev.filter(
                  (n) => n.notificationId !== deletedNotification.notificationId
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id]);
  // ...existing code...

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // if (!session?.user?.id) return null;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
