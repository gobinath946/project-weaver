import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { timeLogsApi } from '@/lib/api';
import { TimeLog } from '@/types';
import { Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';

const TimeLogs = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeLogs = async () => {
    try {
      const response = await timeLogsApi.getAll();
      setTimeLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch time logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeLogs();
  }, []);

  const totalHours = timeLogs.reduce((acc, log) => acc + log.hours, 0);
  const billableHours = timeLogs.filter((log) => log.billingType === 'Billable').reduce((acc, log) => acc + log.hours, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Time Logs</h1>
            <p className="text-muted-foreground mt-1">Track your work hours</p>
          </div>
          <Button className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Log Time
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-3xl font-bold mt-2">{totalHours.toFixed(1)}</p>
                </div>
                <div className="rounded-lg p-3 bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
                  <p className="text-3xl font-bold mt-2">{billableHours.toFixed(1)}</p>
                </div>
                <div className="rounded-lg p-3 bg-success/10">
                  <Clock className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Non-Billable</p>
                  <p className="text-3xl font-bold mt-2">{(totalHours - billableHours).toFixed(1)}</p>
                </div>
                <div className="rounded-lg p-3 bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : timeLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="h-16 w-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-2xl font-semibold mb-2">No time logs yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start tracking your work hours to monitor productivity
            </p>
            <Button size="lg" className="shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Log Your First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {timeLogs.map((log) => (
              <Card key={log._id} className="hover:shadow-lg transition-all duration-300 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{log.hours} hours</span>
                        <Badge variant="outline" className={log.billingType === 'Billable' ? 'bg-success/10 text-success border-success/20' : 'bg-muted'}>
                          {log.billingType}
                        </Badge>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-muted-foreground">{log.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TimeLogs;
