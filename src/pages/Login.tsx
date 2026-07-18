import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://vckjlgjsgzfhfxbvgoph.supabase.co/auth/v1/callback",
        },
      });
      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Google sign-in failed", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        const message = error.message?.includes("fetch")
          ? "Network error. Please open this app in a new tab and try again."
          : error.message;
        toast({ title: "Login failed", description: message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, college")
          .eq("id", session.session.user.id)
          .maybeSingle();
        if (!profile?.full_name || !profile?.college) {
          setIsLoading(false);
          navigate("/setup");
          return;
        }
      }
      setIsLoading(false);
      navigate("/home");
    } catch {
      toast({ title: "Login failed", description: "Network error. Please open this app in a new tab and try again.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 30% 30%, hsl(258 100% 72% / 0.25), transparent 60%), radial-gradient(ellipse 60% 60% at 80% 70%, hsl(190 90% 55% / 0.18), transparent 50%), hsl(var(--background))",
        }}
      >
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center text-center max-w-md"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <div
              className="h-24 w-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl"
              style={{ boxShadow: "var(--glow-primary)" }}
            >
              <img src={logoIcon} alt="Collab.io" className="h-16 w-16 object-contain" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold gradient-text mb-4">Collab.io</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Where students connect, collaborate, and grow together.
          </p>

          <div className="space-y-4 w-full max-w-xs">
            {[
              { icon: "🔍", text: "Discover by skills" },
              { icon: "🤝", text: "Request collaborations" },
              { icon: "🏆", text: "Build your reputation" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 glass-card rounded-xl px-4 py-3"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div
            className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-lg"
            style={{ boxShadow: "var(--glow-primary)" }}
          >
            <img src={logoIcon} alt="Collab.io" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Collab.io</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to continue your journey</p>
          </div>

          {/* Google button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-medium border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all mb-6"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12 bg-muted/40 border-border/60 focus:border-primary/60 focus:bg-background transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-12 bg-muted/40 border-border/60 focus:border-primary/60 focus:bg-background transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm font-semibold gradient-primary border-0 mt-2"
              style={{ boxShadow: "var(--glow-primary)" }}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-1.5 mt-8 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Student collaboration platform</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
