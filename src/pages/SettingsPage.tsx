import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Ban,
  Flag,
  CreditCard,
  IndianRupee,
  Sun,
  Moon,
  Monitor,
  Key,
  ShieldAlert,
  Gavel,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useIsAdmin } from "@/hooks/useAdminData";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSupported, isEnabled, requestPermission, disablePush } = usePushNotifications();
  const { data: isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: "Push notifications enabled",
          description: "You'll receive alerts for new messages and requests.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      await disablePush();
      toast({
        title: "Push notifications disabled",
      });
    }
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          action: "navigate" as const,
          route: "/setup",
        },
        {
          icon: Key,
          label: "Change Password",
          action: "navigate" as const,
          route: "/change-password",
        },
        {
          icon: Shield,
          label: "Privacy Settings",
          action: "navigate" as const,
          route: "/privacy",
        },
        {
          icon: Bell,
          label: "Push Notifications",
          action: "push-toggle" as const,
          sublabel: isSupported ? (isEnabled ? "Enabled" : "Disabled") : "Not supported",
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          icon: CreditCard,
          label: "Payment Info",
          action: "navigate" as const,
          route: "/payment-info",
          sublabel: "Managed via website",
        },
        {
          icon: IndianRupee,
          label: "Earnings & Payouts",
          action: "navigate" as const,
          route: "/earnings",
        },
      ],
    },
    {
      title: "Safety",
      items: [
        {
          icon: ShieldAlert,
          label: "Safety Center",
          action: "navigate" as const,
          route: "/safety-center",
          sublabel: "Violations & disputes",
        },
        {
          icon: Ban,
          label: "Blocked Users",
          action: "navigate" as const,
          route: "/blocked",
        },
        {
          icon: Flag,
          label: "Report a Problem",
          action: "navigate" as const,
          route: "/report",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          action: "navigate" as const,
          route: "/help",
        },
      ],
    },
    // Admin section - only visible to admins
    ...(isAdmin
      ? [
          {
            title: "Admin",
            items: [
              {
                icon: Gavel,
                label: "Admin Dashboard",
                action: "navigate" as const,
                route: "/admin",
                sublabel: "Disputes & moderation",
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Appearance
          </h2>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-medium text-foreground mb-3">Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      theme === option.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sectionIndex + 1) * 0.1 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              {section.title}
            </h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;

                if (item.action === "push-toggle") {
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between p-4 ${
                        itemIndex !== section.items.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">
                            {item.label}
                          </span>
                          {item.sublabel && (
                            <span className="text-xs text-muted-foreground">
                              {item.sublabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <Switch 
                        checked={isEnabled} 
                        onCheckedChange={handlePushToggle}
                        disabled={!isSupported}
                      />
                    </div>
                  );
                }

                if (item.action === "toggle") {
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between p-4 ${
                        itemIndex !== section.items.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <Switch defaultChecked={item.defaultValue} />
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route);
                      }
                    }}
                    className={`flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors ${
                      itemIndex !== section.items.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground block">
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className="text-xs text-muted-foreground">
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-14 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </motion.div>

        {/* App version */}
        <p className="text-center text-xs text-muted-foreground">
          Collabio v1.0.0
        </p>
      </div>
    </div>
  );
}
