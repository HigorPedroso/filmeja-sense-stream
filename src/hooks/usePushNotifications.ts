import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { initializePushNotifications } from "@/lib/push/pushNotifications";

// Requests push permission and registers for FCM once a user is logged in
// — no point prompting before then, and the resulting token needs a
// user_id to be saved against anyway.
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializePushNotifications();
    }
  }, [user]);
}
