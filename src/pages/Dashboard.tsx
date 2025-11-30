import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api';
import { DashboardData } from '@/types';
import { FolderKanban, CheckSquare, Bug, Clock } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardApi.getData();
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { title: 'Active Projects', value: data?.projects.active || 0, total: data?.projects.total || 0, icon: FolderKanban, color: 'text-blue-500' },
    { title: 'Pending Tasks', value: data?.tasks.pending || 0, total: data?.tasks.total || 0, icon: CheckSquare, color: 'text-green-500' },
    { title: 'Open Bugs', value: data?.bugs.open || 0, total: data?.bugs.total || 0, icon: Bug, color: 'text-red-500' },
    { title: 'Weekly Hours', value: data?.timesheet.weeklyHours || 0, total: data?.timesheet.billableHours || 0, icon: Clock, color: 'text-purple-500' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-8 w-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">of {stat.total} total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Recent Tasks</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No recent tasks. Create your first task to get started!</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No upcoming deadlines.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
