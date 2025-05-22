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
    posts: any[]; // You can define a more specific type for posts if needed
  };
}

export interface OverviewPanelProps {
  data?: DashboardData;
  isLoading: boolean;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}