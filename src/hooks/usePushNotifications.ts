import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BNEAiTcypPIsXpFbmIa1Bi6jFkRGOOoIUS3E09cQ631bJZSnG73hT8fs0YYf-9FjbqwLX9LxZlIqnlqL7biZUtA";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Check existing subscription
    if (supported && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && user?.id) {
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push notifications with VAPID key
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
          });
        }

        // Store subscription in device_tokens
        const subscriptionJson = JSON.stringify(subscription.toJSON());
        await supabase.from("device_tokens").upsert(
          {
            user_id: user.id,
            push_enabled: true,
            push_token: subscriptionJson,
          },
          { onConflict: "user_id" }
        );

        setIsSubscribed(true);
      }

      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported, user?.id]);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return;
      }

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            ...options,
          });
        } else {
          new Notification(title, {
            icon: "/pwa-192x192.png",
            ...options,
          });
        }
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    },
    [permission, requestPermission]
  );

  const disablePush = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Unsubscribe from push
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await supabase
        .from("device_tokens")
        .upsert(
          { user_id: user.id, push_enabled: false, push_token: null },
          { onConflict: "user_id" }
        );

      setIsSubscribed(false);
    } catch (error) {
      console.error("Error disabling push:", error);
    }
  }, [user?.id]);

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    showNotification,
    disablePush,
    isEnabled: permission === "granted" && isSubscribed,
  };
}
