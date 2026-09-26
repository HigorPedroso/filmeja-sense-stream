export interface NamedValue {
  name: string;
  value: number;
}

export interface DailyPoint {
  date: string;
  signups: number;
  active_users: number;
  recommendations: number;
  views: number;
}

// Shape returned by the admin_dashboard_metrics() Postgres function
// (supabase/admin_dashboard_rpc.sql).
export interface AdminMetrics {
  users: {
    total: number;
    new: number;
    premium: number;
    active: number;
    dau: number;
    wau: number;
    mau: number;
  };
  languages: NamedValue[];
  devices: NamedValue[];
  daily: DailyPoint[];
  recommendations: {
    total: number;
    users: number;
    by_source: NamedValue[];
    top_titles: NamedValue[];
    top_genres: NamedValue[];
    top_moods: NamedValue[];
  };
  engagement: {
    views: number;
    likes: number;
    dislikes: number;
    saves: number;
    provider_clicks: number;
    watched: number;
    providers: NamedValue[];
  };
  retention: { eligible: number; returned: number };
  funnel: { signed_up: number; onboarded: number; recommended: number; premium: number };
  notifications: { sent: number; received: number; opened: number; by_reason: NamedValue[] };
}

// Shape returned by admin_recent_activity().
export interface AdminActivity {
  users: { id: string; full_name: string; is_premium: boolean; created_at: string }[];
  recommendations: { title: string | null; source: string | null; user_name: string; created_at: string }[];
  reactions: { event_type: string; title: string | null; user_name: string; created_at: string }[];
}

export interface DateRangeType {
  from: Date | undefined;
  to: Date | undefined;
}
