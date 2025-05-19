import { supabase } from "@/integrations/supabase/client";

interface ContentItem {
  media_type: string;
  title?: string;
  name?: string;
  poster_path?: string;
}

export async function addToWatchHistory(content: ContentItem, userId: string) {
  try {
    console.log('Adding to watch history:', { content, userId });

    // Get current count and oldest items
    const { data: historyData, error: countError } = await supabase
      .from('watch_history')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (countError) {
      console.error('Error fetching history:', countError);
      throw countError;
    }

    console.log('Current history:', historyData);

    // If we have 10 or more items, delete the oldest one(s)
    if (historyData && historyData.length >= 10) {
      const oldestId = historyData[0].id;
      const { error: deleteError } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', oldestId);

      if (deleteError) {
        console.error('Error deleting old entry:', deleteError);
        throw deleteError;
      }
    }

    // Add the new item
    const { data: insertData, error: insertError } = await supabase
      .from('watch_history')
      .insert({
        user_id: userId,
        content_id: 0, // Add default content_id since it's required
        content_type: content.media_type,
        title: content.title || content.name,
        poster_path: content.poster_path || "",
        created_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('Error inserting new entry:', insertError);
      throw insertError;
    }

    console.log('Successfully added to history:', insertData);
    return true;
  } catch (error) {
    console.error('Error managing watch history:', error);
    return false;
  }
}