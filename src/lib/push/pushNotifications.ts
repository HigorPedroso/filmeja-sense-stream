import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics/trackEvent";

let initialized = false;

// Requests permission, registers for FCM, and saves the resulting device
// token to Supabase so send-push-notification can find it later. Listeners
// look up the current user at event time (not a captured value) so the
// token always lands on whoever is actually logged in when it arrives.
export async function initializePushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  initialized = true;

  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") return;

    await PushNotifications.addListener("registration", async (token) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("device_push_tokens").upsert(
          {
            user_id: user.id,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,token" }
        );
        if (error) throw error;
      } catch (error: any) {
        // console.error(string, object) shows "[object Object]" over the
        // Capacitor/logcat bridge — stringify explicitly so the actual
        // Postgres/RLS error message is visible.
        console.error("Error saving push token: " + (error?.message || JSON.stringify(error)));
      }
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      trackEvent("notification_received", {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      trackEvent("notification_opened", {
        title: action.notification.title,
        body: action.notification.body,
        data: action.notification.data,
      });
    });

    await PushNotifications.register();
  } catch (error) {
    console.error("Error initializing push notifications:", error);
  }
}
