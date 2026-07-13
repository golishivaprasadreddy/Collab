import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, Users, Gavel, Ban, FileWarning, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin, useAdminStats } from "@/hooks/useAdminData";
import { DisputesPanel } from "@/components/admin/DisputesPanel";
import { ViolationsPanel } from "@/components/admin/ViolationsPanel";
import { PenaltiesPanel } from "@/components/admin/PenaltiesPanel";
import { EventsPanel } from "@/components/admin/EventsPanel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: stats } = useAdminStats();

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-6">
          You don't have permission to access the admin dashboard.
        </p>
        <Button onClick={() => navigate("/home")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-3 text-center">
              <Gavel className="h-5 w-5 mx-auto text-destructive mb-1" />
              <p className="text-2xl font-bold text-destructive">{stats?.openDisputes || 0}</p>
              <p className="text-xs text-muted-foreground">Open Disputes</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-3 text-center">
              <Ban className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
              <p className="text-2xl font-bold text-yellow-600">{stats?.activePenalties || 0}</p>
              <p className="text-xs text-muted-foreground">Active Penalties</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="p-3 text-center">
              <FileWarning className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <p className="text-2xl font-bold text-orange-600">{stats?.unacknowledgedViolations || 0}</p>
              <p className="text-xs text-muted-foreground">New Violations</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="disputes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="disputes" className="text-xs">
              <Gavel className="h-4 w-4 mr-1" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="violations" className="text-xs">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="penalties" className="text-xs">
              <Ban className="h-4 w-4 mr-1" />
              Penalties
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disputes">
            <DisputesPanel />
          </TabsContent>

          <TabsContent value="violations">
            <ViolationsPanel />
          </TabsContent>

          <TabsContent value="penalties">
            <PenaltiesPanel />
          </TabsContent>

          <TabsContent value="events">
            <EventsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
