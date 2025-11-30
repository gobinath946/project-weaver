import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock } from 'lucide-react';
import { timeLogsApi } from '@/lib/api';
import { TimeLog } from '@/types';

const TimeLogs = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchTimeLogs();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Time Logs</h1>
            <p className="text-muted-foreground">Track your time entries</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Log Time</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="h-5 w-48 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : timeLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No time logged</h3>
            <p className="mt-2 text-muted-foreground">Start logging your time to track productivity.</p>
            <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Log Time</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {timeLogs.map((log) => (
              <Card key={log._id} className="hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{log.hours} hours</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.date).toLocaleDateString()} • 
                      {typeof log.projectId === 'object' ? log.projectId.name : 'Project'}
                    </p>
                  </div>
                  <Badge variant={log.billingType === 'Billable' ? 'default' : 'secondary'}>
                    {log.billingType}
                  </Badge>
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
