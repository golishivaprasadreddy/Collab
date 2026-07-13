import { motion } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star, TrendingUp, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rankColors = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-orange-400 to-orange-600",
];

const rankEmoji = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { data: entries = [], isLoading } = useLeaderboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myRank = entries.findIndex((e) => e.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero px-6 pt-12 pb-10 rounded-b-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Leaderboard</h1>
              <p className="text-primary-foreground/80 text-sm">
                Cross-college rankings by contributions
              </p>
            </div>
          </div>
          {myRank > 0 && (
            <div className="mt-4 bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-primary-foreground text-sm">
                Your Rank: <span className="font-bold text-lg">#{myRank}</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-end justify-center gap-3 py-4"
          >
            {[1, 0, 2].map((idx) => {
              const entry = entries[idx];
              if (!entry) return null;
              const isFirst = idx === 0;
              return (
                <div
                  key={entry.user_id}
                  className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}
                  onClick={() => navigate(`/u/${entry.user_id}`)}
                >
                  <span className="text-2xl mb-1">{rankEmoji[idx]}</span>
                  <Avatar className={`${isFirst ? "h-16 w-16" : "h-12 w-12"} ring-2 ring-primary/30`}>
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className={`bg-gradient-to-br ${rankColors[idx]} text-white font-bold ${isFirst ? "text-lg" : "text-sm"}`}>
                      {entry.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className={`font-semibold text-foreground mt-2 text-center ${isFirst ? "text-sm" : "text-xs"} max-w-[80px] truncate`}>
                    {entry.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.points} pts</p>
                  {entry.college && (
                    <p className="text-[10px] text-muted-foreground max-w-[80px] truncate">{entry.college}</p>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No Rankings Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete collaborations to appear on the leaderboard
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/u/${entry.user_id}`)}
                className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors ${
                  entry.user_id === user?.id ? "ring-2 ring-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="w-8 text-center">
                  {index < 3 ? (
                    <span className="text-lg">{rankEmoji[index]}</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {entry.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{entry.full_name}</p>
                  {entry.college && (
                    <p className="text-xs text-muted-foreground truncate">{entry.college}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                    <span className="text-sm font-bold text-foreground">{entry.points}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[10px] text-muted-foreground">
                      {entry.trust_score.toFixed(1)} trust
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
