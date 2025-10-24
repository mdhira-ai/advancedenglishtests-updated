'use client';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Loading from '../loading';



export interface ScheduleSession {
    id: string;
    booker_id: string;
    participant_id: string;
    scheduled_at_utc: string;
    duration_minutes: number;
    title: string | null;
    description: string | null;
    status: string;
    booker_timezone: string | null;
    participant_timezone: string | null;
}



const page = () => {


    const { data: mysession, error, isPending } = useSession()
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);




    useEffect(() => {
        const fetchSchedule = async () => {
            if (!mysession?.user?.id) return;

            try {
                setLoading(true);
                const sessions = await getScheduleSessions(mysession.user.id);
                console.log('Sessions:', sessions);



                // Transform sessions to FullCalendar events
                const calendarEvents = sessions.map((session: ScheduleSession) => ({
                    id: session.id,
                    title: session.title || 'Speaking',
                    date: session.scheduled_at_utc,

                    extendedProps: {
                        description: session.description,
                        status: session.status,
                        isBooker: session.booker_id === mysession.user.id,
                        participantId: session.participant_id,
                        bookerId: session.booker_id,
                    }
                }));
                console.log('Calendar Events:', calendarEvents);

                setEvents(calendarEvents);
            } catch (error) {
                console.error('Error loading schedule:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [mysession]);


    if (loading) {
        return <Loading />
    }






    return (
        <div
            className="max-w-6xl mx-auto p-4 lg:p-6 bg-white shadow rounded-lg m-10"
        >
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                eventContent={renderEventContent} // custom render function
                events={events}
                // events={[
                //     { title: 'event 1', date: '2025-10-28' },
                //     { title: 'event 2', date: '2025-10-29' }
                // ]}
                height="auto"
                eventClick={(info) => {
                    console.log('Event clicked:', info.event);
                }}

            />
        </div>
    );
}

export default page;


function renderEventContent(eventInfo: any) {
    const isBooker = eventInfo.event.extendedProps.isBooker;
    const status = eventInfo.event.extendedProps.status;

    return (
        <div className="p-1">
            <div className="font-semibold text-sm">
                {eventInfo.event.title}
            </div>
            <div className="text-xs">
                {eventInfo.timeText}
            </div>
            <div className="text-xs opacity-75">
                {isBooker ? 'You booked' : 'You participate'}
            </div>
            {status !== 'scheduled' && (
                <div className="text-xs font-medium">
                    Status: {status}
                </div>
            )}
        </div>
    );
}
export async function getScheduleSessions(userId: string) {
    const { data, error } = await supabase
        .from('schedule_sessions')
        .select('*')
        .or(`booker_id.eq.${userId},participant_id.eq.${userId}`)
        .eq('status', 'scheduled')
        .order('scheduled_at_utc', { ascending: true });

    if (error) {
        console.error('Error fetching schedule sessions:', error);
        return [];
    }

    return data as ScheduleSession[];
}