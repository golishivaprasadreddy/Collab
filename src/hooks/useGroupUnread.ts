import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectGroup } from "@/hooks/useProjectGroups";

const STORAGE_KEY = "group-last-seen-v1";

type LastSeenMap = Record<string, string>; // signature -> ISO timestamp

function loadLastSeen(): LastSeenMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLastSeen(map: LastSeenMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

/**
 * Plays a subtle two-tone "ping" using the Web Audio API.
 * No external assets required.
 */
function playNotificationPing() {
  try {
    const AudioCtx =
      (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + start + duration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };

    playTone(880, 0, 0.18);
    playTone(1320, 0.12, 0.22);

    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* silently ignore */
  }
}

/**
 * Tracks unread counts per ProjectGroup (keyed by signature) and plays a
 * subtle ping when a new group message arrives from someone else.
 */
export function useGroupUnread(groups: ProjectGroup[]) {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const lastSeenRef = useRef<LastSeenMap>(loadLastSeen());

  // Build a stable map of collaborationId -> signature for quick lookup
  const collabToSig = new Map<string, string>();
  groups.forEach((g) => {
    g.collaborationIds.forEach((id) => collabToSig.set(id, g.signature));
  });

  // Initial unread count load
  useEffect(() => {
    if (!user?.id || groups.length === 0) return;

    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      for (const g of groups) {
        const since = lastSeenRef.current[g.signature] || "1970-01-01T00:00:00Z";
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("collaboration_request_id", g.collaborationIds)
          .neq("sender_id", user.id)
          .gt("sent_at", since);
        next[g.signature] = count || 0;
      }
      if (!cancelled) setUnreadCounts(next);
    })();

    return () => {
      cancelled = true;
    };
    // Re-run when group set changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, groups.map((g) => g.signature).join("|")]);

  // Realtime subscription on all collaboration ids in any group
  useEffect(() => {
    if (!user?.id || groups.length === 0) return;

    const allCollabIds = Array.from(collabToSig.keys());
    if (allCollabIds.length === 0) return;

    const channel = supabase
      .channel(`group-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as { sender_id?: string; collaboration_request_id?: string } | null;
          if (!msg) return;
          if (msg.sender_id === user.id) return;
          const sig = collabToSig.get(msg.collaboration_request_id);
          if (!sig) return;

          setUnreadCounts((prev) => ({
            ...prev,
            [sig]: (prev[sig] || 0) + 1,
          }));
          playNotificationPing();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, Array.from(collabToSig.keys()).sort().join(",")]);

  const markGroupRead = useCallback((signature: string) => {
    lastSeenRef.current[signature] = new Date().toISOString();
    saveLastSeen(lastSeenRef.current);
    setUnreadCounts((prev) => ({ ...prev, [signature]: 0 }));
  }, []);

  return { unreadCounts, markGroupRead };
}
