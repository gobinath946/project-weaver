import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bug as BugIcon } from 'lucide-react';
import { bugsApi } from '@/lib/api';
import { Bug } from '@/types';

const Bugs = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const response = await bugsApi.getAll();
        setBugs(response.data.data);
      } catch (error) {
        console.error('Failed to fetch bugs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBugs();
  }, []);

  const severityColors: Record<string, string> = {
    None: 'bg-gray-500/10 text-gray-500',
    Low: 'bg-green-500/10 text-green-500',
    Medium: 'bg-yellow-500/10 text-yellow-500',
    High: 'bg-orange-500/10 text-orange-500',
    Critical: 'bg-red-500/10 text-red-500',
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bugs</h1>
            <p className="text-muted-foreground">Track and resolve issues</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Report Bug</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="h-5 w-48 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : bugs.length === 0 ? (
          <Card className="p-12 text-center">
            <BugIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No bugs reported</h3>
            <p className="mt-2 text-muted-foreground">Report a bug when you find an issue.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {bugs.map((bug) => (
              <Card key={bug._id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{bug.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof bug.projectId === 'object' ? bug.projectId.name : 'Unknown Project'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityColors[bug.severity]}>{bug.severity}</Badge>
                    <Badge variant="outline">{bug.status}</Badge>
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

export default Bugs;
