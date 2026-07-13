import { format } from "date-fns";
import { AlertTriangle, MessageSquare, Mail, Phone, Link, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminViolations, ViolationWithDetails } from "@/hooks/useAdminData";
import { Database } from "@/integrations/supabase/types";

const violationIcons: Record<Database["public"]["Enums"]["violation_type"], typeof AlertTriangle> = {
  phone_number: Phone,
  email_address: Mail,
  social_media: Hash,
  external_link: Link,
  prohibited_keyword: MessageSquare,
};

const violationLabels: Record<Database["public"]["Enums"]["violation_type"], string> = {
  phone_number: "Phone Number",
  email_address: "Email Address",
  social_media: "Social Media",
  external_link: "External Link",
  prohibited_keyword: "Prohibited Keyword",
};

export function ViolationsPanel() {
  const { data: violations, isLoading } = useAdminViolations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!violations?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No violations recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {violations.map((violation) => (
        <ViolationCard key={violation.id} violation={violation} />
      ))}
    </div>
  );
}

function ViolationCard({ violation }: { violation: ViolationWithDetails }) {
  const Icon = violationIcons[violation.violation_type] || AlertTriangle;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={violation.user_profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {violation.user_profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">
                {violation.user_profile?.full_name || "Unknown User"}
              </span>
              <Badge
                variant="outline"
                className={
                  violation.acknowledged
                    ? "bg-green-500/20 text-green-600 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                }
              >
                {violation.acknowledged ? "Acknowledged" : "Pending"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {violationLabels[violation.violation_type]}
            </p>
            {violation.blocked_content && (
              <div className="bg-muted/50 rounded p-2 text-xs font-mono text-muted-foreground break-all">
                {violation.blocked_content}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(violation.created_at || ""), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
