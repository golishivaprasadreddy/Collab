import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Building2, Users, GraduationCap, Settings2, QrCode, Award, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Event } from "@/hooks/useEvents";
import { RegisterDialog } from "./RegisterDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";

const eventTypeIcons: Record<string, string> = {
  hackathon: "🏆",
  coding_competition: "💻",
  tech_challenge: "⚡",
  startup: "🚀",
  summit: "🎤",
  business_competition: "📊",
  workshop: "🛠️",
};

const eventTypeLabels: Record<string, string> = {
  hackathon: "Hackathon",
  coding_competition: "Coding Competition",
  tech_challenge: "Tech Challenge",
  startup: "Startup Event",
  summit: "Summit",
  business_competition: "Business Competition",
  workshop: "Workshop",
};

const modeColors: Record<string, string> = {
  online: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  offline: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  hybrid: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface EventCardProps {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const [openRegister, setOpenRegister] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const canManage = !!user && (user.id === event.organizer_id || isAdmin);

  const now = new Date();
  const eventDate = new Date(event.event_date);
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isDeadlinePassed = deadline && deadline < now;
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isTeamEvent = (event.max_team_size ?? 1) > 1;

  // My registration for this event
  const { data: myReg } = useQuery({
    queryKey: ["my-event-reg", event.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: myCerts = [] } = useQuery({
    queryKey: ["my-event-certs", event.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("event_certificates")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (showQr && myReg && user) {
      const payload = `collabio:event:${event.id}:reg:${myReg.id}:user:${user.id}`;
      QRCode.toDataURL(payload, { width: 360, margin: 2 }).then(setQrUrl);
    }
  }, [showQr, myReg, user, event.id]);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px -12px hsl(var(--primary) / 0.2)" }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-colors"
    >
      {event.image_url && (
        <motion.div className="h-36 overflow-hidden" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </motion.div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <motion.span
                className="text-lg"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {eventTypeIcons[event.event_type] || "📌"}
              </motion.span>
              <Badge variant="secondary" className="text-[10px]">
                {eventTypeLabels[event.event_type] || event.event_type}
              </Badge>
              {event.scope === "college" && event.college && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {event.college}
                </Badge>
              )}
              {isTeamEvent && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Users className="h-3 w-3" />
                  Team {event.min_team_size}-{event.max_team_size}
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-foreground text-base leading-tight">{event.title}</h3>
          </div>
          <Badge className={`${modeColors[event.mode]} text-[10px] flex-shrink-0`}>
            {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
          </Badge>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary/70" />
            <span>
              {eventDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary/70" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary/70" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span
                className={
                  isDeadlinePassed
                    ? "text-destructive"
                    : daysUntilDeadline !== null && daysUntilDeadline <= 3
                    ? "text-warning font-medium"
                    : "text-muted-foreground"
                }
              >
                {isDeadlinePassed
                  ? "Registration closed"
                  : `Deadline: ${deadline.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}${daysUntilDeadline !== null ? ` (${daysUntilDeadline}d left)` : ""}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {myReg ? (
            <>
              <Button size="sm" variant="outline" className="flex-1" disabled>
                ✓ Registered
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowQr(true)}>
                <QrCode className="h-3.5 w-3.5 mr-1" /> My QR
              </Button>
            </>
          ) : !isDeadlinePassed ? (
            <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
              <Button size="sm" className="w-full" onClick={() => setOpenRegister(true)}>
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Register
              </Button>
            </motion.div>
          ) : (
            <Button size="sm" variant="outline" className="flex-1" disabled>
              Registration Closed
            </Button>
          )}
          {canManage && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/events/${event.id}/manage`)}>
              <Settings2 className="h-3.5 w-3.5 mr-1" /> Manage
            </Button>
          )}
        </div>

        {myCerts.length > 0 && (
          <div className="border-t border-border pt-2 flex flex-wrap gap-1.5">
            {myCerts.map((c: { id: string; certificate_url: string; certificate_type: string }) => (
              <a key={c.id} href={c.certificate_url} target="_blank" rel="noreferrer">
                <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10">
                  <Award className="h-3 w-3 text-warning" />
                  {c.certificate_type} certificate
                  <Download className="h-3 w-3" />
                </Badge>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
    <RegisterDialog event={event} open={openRegister} onOpenChange={setOpenRegister} />
    <Dialog open={showQr} onOpenChange={setShowQr}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Your check-in QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {qrUrl ? <img src={qrUrl} alt="QR" className="w-full" /> : <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">Generating...</div>}
          <p className="text-xs text-muted-foreground text-center">Show this to the organizer at the event entry.</p>
          {qrUrl && (
            <a href={qrUrl} download={`event-qr-${event.id.slice(0,8)}.png`} className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-1" /> Save image
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
