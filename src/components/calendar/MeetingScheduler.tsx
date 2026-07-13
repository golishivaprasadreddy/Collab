import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CalendarIcon, Clock, Plus, Loader2, Trash2 } from "lucide-react";
import { format, setHours, setMinutes, isBefore } from "date-fns";
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/useCalendarEvents";
import { useToast } from "@/hooks/use-toast";

interface MeetingSchedulerProps {
  collaborationRequestId: string;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00",
];

const durationOptions = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

export function MeetingScheduler({ collaborationRequestId }: MeetingSchedulerProps) {
  const { toast } = useToast();
  const { data: events = [], isLoading } = useCalendarEvents(collaborationRequestId);
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("60");

  const handleCreateMeeting = async () => {
    if (!selectedDate || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a title and select a date.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    try {
      await createEvent.mutateAsync({
        collaboration_request_id: collaborationRequestId,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      toast({
        title: "Meeting scheduled! 📅",
        description: `${title} on ${format(startDateTime, "PPP 'at' p")}`,
      });

      setIsOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Failed to schedule meeting",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync({ 
        id: eventId, 
        collaborationRequestId 
      });
      toast({ title: "Meeting cancelled" });
    } catch (error) {
      toast({
        title: "Failed to cancel meeting",
        variant: "destructive",
      });
    }
  };

  const upcomingEvents = events.filter(
    (e) => !isBefore(new Date(e.start_time), new Date())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Scheduled Meetings</h3>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>Schedule a Meeting</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 pb-8">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Project kickoff call"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Meeting agenda or notes..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Date</Label>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => isBefore(date, new Date())}
                    className="rounded-xl border border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="h-12">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateMeeting}
                className="w-full h-14 gradient-primary border-0 text-base"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CalendarIcon className="h-5 w-5 mr-2" />
                )}
                Schedule Meeting
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No upcoming meetings</p>
          <p className="text-xs mt-1">Schedule a meeting to collaborate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_time), "PPP")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_time), "p")} - {format(new Date(event.end_time), "p")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteEvent(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
