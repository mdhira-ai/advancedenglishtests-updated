"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Loading from "../loading";
import ShowDialog from "./components/ShowDialog";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users } from "lucide-react";

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
  const router = useRouter();
  const { data: mysession, error, isPending } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!mysession && !isPending) {
      router.push("/login");
    }
  }, [mysession, isPending, router]);

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  const handleEventClick = (info: any) => {
    const sessionData = {
      id: info.event.id,
      title: info.event.title,
      status: info.event.extendedProps.status,
      description: info.event.extendedProps.description,
      startTime: info.event.start,
      isBooker: info.event.extendedProps.isBooker,
      participantId: info.event.extendedProps.participantId,
      bookerId: info.event.extendedProps.bookerId,
    };

    setSelectedSession(sessionData);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!mysession?.user?.id) return;

      try {
        setLoading(true);
        const sessions = await getScheduleSessions(mysession.user.id);
        console.log("Sessions:", sessions);

        // Transform sessions to FullCalendar events
        const calendarEvents = sessions.map((session: ScheduleSession) => ({
          id: session.id,
          title: session.title || "Speaking",
          date: session.scheduled_at_utc,

          extendedProps: {
            description: session.description,
            status: session.status,
            isBooker: session.booker_id === mysession.user.id,
            participantId: session.participant_id,
            bookerId: session.booker_id,
          },
        }));
        console.log("Calendar Events:", calendarEvents);

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [mysession]);

  if (loading) {
    return <Loading />;
  }

  if(!mysession?.user){
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#1A3A6E] rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A3A6E]">
              Speaking Schedule
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
            Manage your speaking practice sessions. View upcoming sessions, track your bookings, and stay organized with your speaking practice schedule.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4f5bd5]/10 rounded-lg">
                <Calendar className="w-5 h-5 text-[#4f5bd5]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-[#1A3A6E]">{events.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1A3A6E]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#1A3A6E]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">You Booked</p>
                <p className="text-2xl font-bold text-[#1A3A6E]">
                  {events.filter(e => e.extendedProps.isBooker).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff8c42]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#ff8c42]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">You Participate</p>
                <p className="text-2xl font-bold text-[#1A3A6E]">
                  {events.filter(e => !e.extendedProps.isBooker).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <FullCalendar
              timeZone="local"
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek"
              }}
              eventContent={renderEventContent}
              events={events}
              height="auto"
              eventClick={handleEventClick}
              eventClassNames="cursor-pointer"
              dayCellClassNames="hover:bg-gray-50 transition-colors"
              dayMaxEvents={3}
              moreLinkClassNames="text-blue-600 hover:text-blue-700 font-medium text-xs"
              viewClassNames="calendar-custom"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1A3A6E] mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#1A3A6E] rounded"></div>
              <span className="text-sm text-gray-600">You booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#4f5bd5] rounded"></div>
              <span className="text-sm text-gray-600">You participate</span>
            </div>
          </div>
        </div>
      </div>

      <ShowDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sessionData={selectedSession}
      />

      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-button {
          background-color: #1A3A6E;
          border-color: #1A3A6E;
          text-transform: capitalize;
          padding: 0.5rem 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .fc .fc-button:hover {
          background-color: #142d57;
          border-color: #142d57;
        }
        .fc .fc-button:focus {
          box-shadow: 0 0 0 3px rgba(26, 58, 110, 0.2);
        }
        .fc .fc-button-active {
          background-color: #4f5bd5 !important;
          border-color: #4f5bd5 !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #94a3b8;
          border-color: #94a3b8;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        .fc .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
          color: #374151;
        }
        .fc .fc-day-today {
          background-color: #f0f4ff !important;
        }
        .fc .fc-col-header-cell {
          background-color: #f8fafc;
          padding: 0.75rem;
          font-weight: 600;
          color: #1A3A6E;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .fc .fc-event {
          border-radius: 0.375rem;
          border: none;
          padding: 2px;
          margin: 1px 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .fc .fc-event:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A3A6E;
        }
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 0.75rem;
          }
          .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          .fc .fc-toolbar-title {
            font-size: 1.25rem;
          }
          .fc .fc-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default page;

function renderEventContent(eventInfo: any) {
  const isBooker = eventInfo.event.extendedProps.isBooker;
  const status = eventInfo.event.extendedProps.status;

  // Color coding based on role - using site's primary colors
  const bgColor = isBooker ? "bg-[#1A3A6E]" : "bg-[#4f5bd5]";
  const textColor = "text-white";

  return (
    <div className={`${bgColor} ${textColor} p-1.5 rounded h-full overflow-hidden hover:opacity-90 transition-opacity`}>
      <div className="flex flex-col h-full">
        <div className="font-semibold text-xs sm:text-sm truncate">
          {eventInfo.event.title}
        </div>
        <div className="text-xs opacity-90 mt-0.5">
          {eventInfo.timeText}
        </div>
        <div className="text-xs opacity-80 mt-1 flex-grow">
          {isBooker ? "📅 You booked" : "🎯 You participate"}
        </div>
        {status !== "scheduled" && (
          <div className="text-xs font-medium mt-1 bg-white bg-opacity-20 px-1 py-0.5 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
export async function getScheduleSessions(userId: string) {
  const { data, error } = await supabase
    .from("schedule_sessions")
    .select("*")
    .or(`booker_id.eq.${userId},participant_id.eq.${userId}`)
    .eq("status", "scheduled")
    .order("scheduled_at_utc", { ascending: true });

  if (error) {
    console.error("Error fetching schedule sessions:", error);
    return [];
  }

  return data as ScheduleSession[];
}
