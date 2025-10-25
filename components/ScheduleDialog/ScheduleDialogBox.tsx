import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import ScheduleCalender from "./ScheduleCalender";
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabase";
import { UsersData } from "@/lib/SpeakingPageProvider";
import { useSession } from "@/lib/auth-client";

const ScheduleDialogBox = ({ userDetails }: { userDetails: UsersData }) => {
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const { data: session } = useSession();

    // Memoize the callback to prevent re-creation on every render
    const handleDateTimeChange = useCallback((dateTime: Date) => {
        setSelectedDateTime(dateTime);
    }, []);

    const sendEmailToUser = async () => {
        if (selectedDateTime) {
            try {
                const bookerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const bookerLocalTime = selectedDateTime.toLocaleString("en-US", { timeZone: bookerTimezone });


                const bookerUTC = selectedDateTime.toISOString();

                const { data, error } = await supabase
                    .from('schedule_sessions')
                    .insert([
                        {
                            participant_id: userDetails.user.id,
                            booker_id: session?.user.id,
                            scheduled_at_utc: bookerUTC,
                            booker_timezone: bookerLocalTime,
                        },
                    ])
                    .select('id'); // Returns all columns including the auto-generated ID


                //model Notifications {
                //   notificationId    BigInt             @id @default(autoincrement())
                //   type              String
                //   isRead            Boolean            @default(false)
                //   createdAt         DateTime           @default(now())
                //   userId            String
                //   actorId           String

                //   // sessionId is optional, its connected to schedule_sessions when applicable
                //   sessionId         String? 
                //   actor             User               @relation("ActorNotifications", fields: [actorId], references: [id], onDelete: Cascade)
                //   schedule_sessions schedule_sessions? @relation("SessionNotifications", fields: [sessionId], references: [id], onDelete: Cascade)
                //   user              User               @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
                // }

                // Here you can implement the notification creation logic using your preferred method/library
                const { data: notificationData, error: notificationError } = await supabase
                    .from('Notifications')
                    .insert([
                        {
                            type: 'session_scheduled',
                            userId: userDetails.user.id,
                            actorId: session?.user.id,
                            sessionId: data?.[0].id,
                        },
                    ]);

                if (notificationError) {
                    throw new Error(notificationError.message);
                }




                // console.log("Session scheduled with ID:", data?.[0].id);
                toast.success("Session booked successfully!.");

                if (error) {
                    throw new Error(error.message);
                }

                // Here you can implement the email sending logic using your preferred method/library
            } catch (error) {
                console.error("Error scheduling session:", error);
                toast.error("Error scheduling session. Please try again later.");
            }


        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger
                className="w-full h-7 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50">
                Schedule
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Book a Session
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <ScheduleCalender onDateTimeChange={handleDateTimeChange} />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={sendEmailToUser}>
                        Book
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ScheduleDialogBox;