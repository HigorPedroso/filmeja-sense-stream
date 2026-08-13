import { supabase } from "@/integrations/supabase/client";

// Feeds the "smart" push notification engine: favorite genres/moods, active
// hours, rejected recommendations, saved titles, and whether notifications
// actually get opened. See supabase/user_events.sql for the table.
export type AppEventType =
  | "app_opened"
  | "mood_selected"
  | "genre_selected"
  | "recommendation_generated"
  | "title_viewed"
  | "title_liked"
  | "title_disliked"
  | "title_saved"
  | "streaming_provider_clicked"
  | "notification_received"
  | "notification_opened";

// Fire-and-forget: never blocks or throws into the caller. A dropped
// analytics row isn't worth interrupting the feature the user is actually
// using.
export async function trackEvent(eventType: AppEventType, metadata: Record<string, unknown> = {}): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_events").insert({
      user_id: user.id,
      event_type: eventType,
      metadata,
    });

    if (error) throw error;
  } catch (error) {
    console.error(`Error tracking event "${eventType}":`, error);
  }
}
