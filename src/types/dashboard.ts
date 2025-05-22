export interface DashboardData {
  users: {
    total: number;
    active: number;
    withSubscription: number;
  };
  recommendations: {
    total: number;
    avgRating: number;
    byType: Record<string, number>;
  };
  watched: {
    total: number;
    uniqueUsers: number;
    avgDuration: number;
    byType: Record<string, number>;
  };
  subscriptions: {
    total: number;
    active: number;
    byPlan: Record<string, number>;
  };
  revenue: {
    total: number;
    transactions: number;
  };
  blogPosts: {
    total: number;
    published: number;
    draft: number;
    posts: any[];
  };
}

export interface DateRangeType {
  from: Date | undefined;
  to: Date | undefined;
}

export interface PanelProps {
  data?: DashboardData;
  isLoading: boolean;
  dateRange: DateRangeType;
}