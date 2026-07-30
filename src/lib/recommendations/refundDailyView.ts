import { supabase } from "@/integrations/supabase/client";

// Reverts the daily/monthly view counters to their pre-request values when a
// recommendation fails to load after the coin was already spent, so a failed
// fetch doesn't cost the user one of their free daily queries.
export async function refundDailyView(
  userId: string,
  viewDate: string,
  dailyViews: number,
  monthlyViews: number
): Promise<void> {
  await supabase.from("user_recommendation_views").upsert(
    {
      user_id: userId,
      view_date: viewDate,
      daily_views: dailyViews,
      monthly_views: monthlyViews,
    },
    {
      onConflict: ["user_id", "view_date"],
    }
  );
}
