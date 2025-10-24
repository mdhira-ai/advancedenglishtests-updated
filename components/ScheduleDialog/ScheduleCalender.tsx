import { Calendar } from "@/components/ui/calendar"
import { useCallback, useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";


interface ScheduleCalenderProps {
    onDateTimeChange?: (dateTime: Date) => void;
}

const ScheduleCalender = ({ onDateTimeChange }: ScheduleCalenderProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [timeZone, setTimeZone] = useState<string | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string>("10:30:00")

    useEffect(() => {
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }, [])

    // Memoize the callback to prevent infinite loops
    const handleDateTimeChange = useCallback(() => {
        if (date && onDateTimeChange) {
            const [hours, minutes, seconds] = selectedTime.split(':').map(Number);
            const selectedDateTime = new Date(date);
            selectedDateTime.setHours(hours, minutes, seconds);
            onDateTimeChange(selectedDateTime);
        }
    }, [date, selectedTime, onDateTimeChange]);

    useEffect(() => {
        handleDateTimeChange();
    }, [handleDateTimeChange]);





    return (
        <div
            className="flex flex-row flex-wrap lg:flex-nowrap justify-center  w-full max-w-sm gap-4 py-4"
        >
            <div className="flex flex-col gap-3">
                <Label htmlFor="date-picker" className="px-1">
                    Date
                </Label>


                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    timeZone={timeZone}
                    className="rounded-lg border"
                />
            </div>

            <div className="flex flex-col gap-3">
                <Label htmlFor="time-picker" className="px-1">
                    Time
                </Label>
                <Input
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    type="time"
                    id="time-picker"
                    step="1"
                    defaultValue="10:30:00"
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />

                <div className="flex flex-col gap-3">
                    <p>
                        selected date and time: {date?.toDateString()} {" "}
                    </p>
                    <p>
                        at {selectedTime}
                    </p>
                    <p>
                        {timeZone && ` (${timeZone})`}
                    </p>


                </div>

            </div>
        </div>
    )
}
export default ScheduleCalender