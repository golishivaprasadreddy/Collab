import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ScanLine, QrCode, Award, Users, Loader2, Download, Search, CheckCircle2, Trophy } from "lucide-react";
import QRCode from "qrcode";
import { QRScanner } from "@/components/events/QRScanner";
import { generateCertificatePdf, uploadAndRecordCertificate } from "@/lib/certificate";
import { useToast } from "@/hooks/use-toast";

export default function EventManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [issuingFor, setIssuingFor] = useState<string | null>(null);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isOrganizer = !!event && user?.id === event.organizer_id;
  const canManage = isOrganizer || !!isAdmin;

  const { data: registrations = [] } = useQuery({
    queryKey: ["event-regs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id!)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      // Fetch profiles
      const ids = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, college")
        .in("id", ids);
      return data.map((r) => ({
        ...r,
        profile: profiles?.find((p) => p.id === r.user_id),
      }));
    },
    enabled: !!id && canManage,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["event-attendance", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_attendance").select("*").eq("event_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && canManage,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["event-certs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_certificates").select("*").eq("event_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && canManage,
  });

  const attendedSet = useMemo(() => new Set(attendance.map((a) => a.user_id)), [attendance]);
  const certSet = useMemo(() => new Set(certificates.map((c) => c.user_id + ":" + c.certificate_type)), [certificates]);

  const checkIn = useMutation({
    mutationFn: async ({ userId, registrationId }: { userId: string; registrationId?: string }) => {
      const { error } = await supabase.from("event_attendance").insert({
        event_id: id!,
        user_id: userId,
        registration_id: registrationId || null,
        checked_in_by: user!.id,
      });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-attendance", id] });
      toast({ title: "Checked in ✅" });
    },
    onError: (e: Error) => toast({ title: "Check-in failed", description: e.message, variant: "destructive" }),
  });

  const handleScan = (text: string) => {
    // QR payload format: collabio:event:<eventId>:reg:<registrationId>:user:<userId>
    try {
      const parts = text.split(":");
      const evIdx = parts.indexOf("event");
      const regIdx = parts.indexOf("reg");
      const usrIdx = parts.indexOf("user");
      if (evIdx === -1 || usrIdx === -1) throw new Error("Invalid QR");
      const evId = parts[evIdx + 1];
      const userId = parts[usrIdx + 1];
      const regId = regIdx !== -1 ? parts[regIdx + 1] : undefined;
      if (evId !== id) {
        toast({ title: "Wrong event QR", variant: "destructive" });
        return;
      }
      if (attendedSet.has(userId)) {
        toast({ title: "Already checked in" });
        return;
      }
      checkIn.mutate({ userId, registrationId: regId });
    } catch {
      toast({ title: "Invalid QR code", variant: "destructive" });
    }
  };

  const issueCertificate = async (
    userId: string,
    name: string,
    type: "participant" | "winner" | "organizer" | "volunteer"
  ) => {
    if (!event || !user) return;
    const key = userId + ":" + type;
    if (certSet.has(key)) {
      toast({ title: "Certificate already issued" });
      return;
    }
    setIssuingFor(key);
    try {
      const blob = generateCertificatePdf({
        recipientName: name || "Participant",
        eventTitle: event.title,
        eventDate: event.event_date,
        certificateType: type,
        organizerName: "Collabio",
      });
      await uploadAndRecordCertificate({
        eventId: event.id,
        userId,
        type,
        blob,
        issuedBy: user.id,
      });
      qc.invalidateQueries({ queryKey: ["event-certs", id] });
      toast({ title: `${type} certificate issued 🏆` });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to issue";
      toast({ title: "Failed to issue", description: message, variant: "destructive" });
    } finally {
      setIssuingFor(null);
    }
  };

  const bulkIssue = async () => {
    const attendees = registrations.filter((r) => attendedSet.has(r.user_id));
    if (attendees.length === 0) {
      toast({ title: "No attendees yet" });
      return;
    }
    toast({ title: `Issuing ${attendees.length} certificates...` });
    for (const r of attendees) {
      const key = r.user_id + ":participant";
      if (certSet.has(key)) continue;
      await issueCertificate(r.user_id, r.profile?.full_name || "Participant", "participant");
    }
  };

  const downloadParticipantQr = async (registrationId: string, userId: string) => {
    if (!event) return;
    const payload = `collabio:event:${event.id}:reg:${registrationId}:user:${userId}`;
    const dataUrl = await QRCode.toDataURL(payload, { width: 400, margin: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${registrationId.slice(0, 8)}.png`;
    a.click();
  };

  const filteredRegs = registrations.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.profile?.full_name?.toLowerCase().includes(q) ||
      r.team_name?.toLowerCase().includes(q)
    );
  });

  if (loadingEvent) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!event) return <div className="p-6">Event not found</div>;
  if (!canManage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">You don't have access to manage this event.</p>
        <Button onClick={() => navigate("/events")}>Back to events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate">{event.title}</h1>
            <p className="text-xs text-muted-foreground">Event control panel</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{registrations.length}</p>
            <p className="text-[10px] text-muted-foreground">Registered</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto text-success mb-1" />
            <p className="text-xl font-bold">{attendance.length}</p>
            <p className="text-[10px] text-muted-foreground">Checked in</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Award className="h-4 w-4 mx-auto text-warning mb-1" />
            <p className="text-xl font-bold">{certificates.length}</p>
            <p className="text-[10px] text-muted-foreground">Certificates</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="registrations">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registrations" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" />List</TabsTrigger>
            <TabsTrigger value="scan" className="text-xs"><ScanLine className="h-3.5 w-3.5 mr-1" />Scan QR</TabsTrigger>
            <TabsTrigger value="certs" className="text-xs"><Award className="h-3.5 w-3.5 mr-1" />Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredRegs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No registrations yet.</p>
            ) : (
              filteredRegs.map((r) => {
                const checked = attendedSet.has(r.user_id);
                return (
                  <Card key={r.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{r.profile?.full_name || "Anonymous"}</p>
                          {r.team_name && (
                            <Badge variant="outline" className="text-[10px] mt-1">Team: {r.team_name}</Badge>
                          )}
                          {r.profile?.college && (
                            <p className="text-[11px] text-muted-foreground mt-1">{r.profile.college}</p>
                          )}
                          {checked && <Badge className="text-[10px] mt-1 bg-success/20 text-success">Checked in</Badge>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => downloadParticipantQr(r.id, r.user_id)}>
                            <QrCode className="h-3 w-3 mr-1" /> QR
                          </Button>
                          {!checked && (
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => checkIn.mutate({ userId: r.user_id, registrationId: r.id })}>
                              Check in
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="scan" className="space-y-3 mt-4">
            {scanning ? (
              <>
                <QRScanner onScan={handleScan} />
                <Button variant="outline" className="w-full" onClick={() => setScanning(false)}>
                  Stop scanning
                </Button>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <ScanLine className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold mb-1">Scan participant QR</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Point your camera at a participant's QR to mark attendance.
                  </p>
                  <Button onClick={() => setScanning(true)}>Start camera</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="certs" className="space-y-3 mt-4">
            <Button onClick={bulkIssue} className="w-full" disabled={!!issuingFor}>
              <Award className="h-4 w-4 mr-2" />
              Bulk issue participant certificates
            </Button>
            {registrations.map((r) => {
              const hasParticipant = certSet.has(r.user_id + ":participant");
              const hasWinner = certSet.has(r.user_id + ":winner");
              const userCerts = certificates.filter((c) => c.user_id === r.user_id);
              return (
                <Card key={r.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{r.profile?.full_name || "Participant"}</p>
                      {attendedSet.has(r.user_id) && <Badge className="text-[10px] bg-success/20 text-success">Attended</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={hasParticipant ? "outline" : "default"}
                        className="h-7 text-[11px]"
                        disabled={hasParticipant || issuingFor === r.user_id + ":participant"}
                        onClick={() => issueCertificate(r.user_id, r.profile?.full_name || "Participant", "participant")}
                      >
                        {issuingFor === r.user_id + ":participant" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Award className="h-3 w-3 mr-1" />}
                        {hasParticipant ? "Participant ✓" : "Issue participant"}
                      </Button>
                      <Button
                        size="sm"
                        variant={hasWinner ? "outline" : "secondary"}
                        className="h-7 text-[11px]"
                        disabled={hasWinner || issuingFor === r.user_id + ":winner"}
                        onClick={() => issueCertificate(r.user_id, r.profile?.full_name || "Winner", "winner")}
                      >
                        {issuingFor === r.user_id + ":winner" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trophy className="h-3 w-3 mr-1" />}
                        {hasWinner ? "Winner ✓" : "Issue winner"}
                      </Button>
                      {userCerts.map((c) => (
                        <a key={c.id} href={c.certificate_url || "#"} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                            <Download className="h-3 w-3 mr-1" />{c.certificate_type}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
