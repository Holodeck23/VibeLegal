import React, { useState, useEffect } from 'react';
import { AdminMetricsCard } from './AdminMetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Activity,
  UserPlus
} from 'lucide-react';

/**
 * AdminDashboard Component
 * Main admin overview page displaying system metrics and recent activity
 */
export function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      // Fetch metrics and recent activity in parallel
      const [metricsRes, activityRes] = await Promise.all([
        fetch('/api/admin/metrics/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/metrics/recent-activity?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!metricsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const metricsData = await metricsRes.json();
      const activityData = await activityRes.json();

      setMetrics(metricsData.metrics);
      setRecentActivity(activityData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load dashboard: {error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System overview and recent activity
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricsCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          description={`${metrics?.newUsersThisMonth || 0} new this month`}
          icon={Users}
        />
        <AdminMetricsCard
          title="Total Contracts"
          value={metrics?.totalContracts || 0}
          description={`${metrics?.contractsThisMonth || 0} created this month`}
          icon={FileText}
        />
        <AdminMetricsCard
          title="Active Users"
          value={metrics?.activeSubscriptions || 0}
          description="Users with contracts this month"
          icon={TrendingUp}
        />
        <AdminMetricsCard
          title="Subscription Tiers"
          value={
            Object.values(metrics?.subscriptionBreakdown || {}).reduce(
              (a, b) => a + b,
              0
            )
          }
          description={`${metrics?.subscriptionBreakdown?.pro || 0} Pro, ${
            metrics?.subscriptionBreakdown?.enterprise || 0
          } Enterprise`}
          icon={DollarSign}
        />
      </div>

      {/* Subscription Breakdown */}
      {metrics?.subscriptionBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {Object.entries(metrics.subscriptionBreakdown).map(
                ([tier, count]) => (
                  <div key={tier} className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {tier}
                      </span>
                      <Badge variant={tier === 'enterprise' ? 'default' : 'secondary'}>
                        {count}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (count / metrics.totalUsers) * 100
                          }%`
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.recentContracts?.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.recentContracts.slice(0, 5).map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contract.title || 'Untitled Contract'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contract.user_email}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <Badge variant="outline" className="text-xs">
                        {contract.contract_type}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent contracts</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.recentSignups?.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.recentSignups.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        user.subscription_tier === 'enterprise'
                          ? 'default'
                          : user.subscription_tier === 'pro'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="ml-4"
                    >
                      {user.subscription_tier}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent signups</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Activity className="mr-2 h-4 w-4" />
          Refresh Data
        </button>
      </div>
    </div>
  );
}
