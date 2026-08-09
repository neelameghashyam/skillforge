"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { dateFnsLocalizer, type View, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek as dfStartOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useEvents } from "@/hooks/queries/use-events";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Tables } from "@/types/database";

const Calendar = dynamic(() => import("react-big-calendar").then((mod) => mod.Calendar), { ssr: false });
const EventDialog = dynamic(() => import("@/components/calendar/event-dialog").then((mod) => mod.EventDialog), { ssr: false });

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => dfStartOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: Tables<"events">;
}

export default function CalendarPage() {
  const { data: events, isLoading } = useEvents();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Tables<"events"> | undefined>();
  const [slotDefaults, setSlotDefaults] = useState<{ start: Date; end: Date } | undefined>();

  const calendarEvents: CalEvent[] = useMemo(
    () =>
      (events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start_time),
        end: new Date(e.end_time),
        allDay: e.all_day,
        resource: e,
      })),
    [events]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">All your events, deep-work blocks, and sessions in one view.</p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(undefined);
            setSlotDefaults(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New event
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4" style={{ height: 720 }}>
        {!isLoading && (
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            selectable
            style={{ height: "100%" }}
            eventPropGetter={(event: CalEvent) => ({
              style: { backgroundColor: event.resource.color, borderColor: event.resource.color },
            })}
            onSelectEvent={(event: CalEvent) => {
              setEditingEvent(event.resource);
              setDialogOpen(true);
            }}
            onSelectSlot={(slotInfo: SlotInfo) => {
              setEditingEvent(undefined);
              setSlotDefaults({ start: slotInfo.start, end: slotInfo.end });
              setDialogOpen(true);
            }}
          />
        )}
      </div>

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={editingEvent} defaultSlot={slotDefaults} />
    </div>
  );
}
