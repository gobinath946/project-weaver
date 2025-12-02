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
    { title: 'Active Projects', value: data?.projects.active || 0, total: data?.projects.total || 0, icon: FolderKanban, gradient: 'from-info to-info/80' },
    { title: 'Pending Tasks', value: data?.tasks.pending || 0, total: data?.tasks.total || 0, icon: CheckSquare, gradient: 'from-success to-success/80' },
    { title: 'Open Bugs', value: data?.bugs.open || 0, total: data?.bugs.total || 0, icon: Bug, gradient: 'from-destructive to-destructive/80' },
    { title: 'Weekly Hours', value: data?.timesheet.weeklyHours || 0, total: data?.timesheet.billableHours || 0, icon: Clock, gradient: 'from-primary to-primary/80' },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-8 w-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`rounded-lg p-2 bg-gradient-to-br ${stat.gradient} shadow-md group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">of {stat.total} total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">No recent tasks.</p>
                <p className="text-muted-foreground text-xs mt-1">Create your first task to get started!</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">No upcoming deadlines.</p>
                <p className="text-muted-foreground text-xs mt-1">All tasks are on track!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
