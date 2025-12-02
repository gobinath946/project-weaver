import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { bugsApi } from '@/lib/api';
import { Bug as BugType } from '@/types';
import { Plus, Search, Bug, AlertCircle } from 'lucide-react';

const Bugs = () => {
  const [bugs, setBugs] = useState<BugType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchBugs();
  }, []);

  const filteredBugs = bugs.filter((bug) =>
    bug.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    const colors = {
      None: 'bg-muted text-muted-foreground',
      Low: 'bg-info/10 text-info border-info/20',
      Medium: 'bg-warning/10 text-warning border-warning/20',
      High: 'bg-destructive/10 text-destructive border-destructive/20',
      Critical: 'bg-destructive text-destructive-foreground',
    };
    return colors[severity as keyof typeof colors] || 'bg-muted';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Bugs</h1>
            <p className="text-muted-foreground mt-1">Track and manage all bugs</p>
          </div>
          <Button className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Report Bug
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filteredBugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bug className="h-16 w-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-2xl font-semibold mb-2">No bugs found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery ? 'Try adjusting your search query' : 'Great! No bugs to report yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBugs.map((bug) => (
              <Card key={bug._id} className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-2.5 bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {bug.title}
                        </h3>
                      </div>
                      {bug.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {bug.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getSeverityColor(bug.severity)}>
                          {bug.severity} Severity
                        </Badge>
                        <Badge variant="outline">
                          {bug.priority} Priority
                        </Badge>
                        {bug.classification && (
                          <Badge variant="outline" className="bg-accent/50 text-accent-foreground">
                            {bug.classification.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
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

export default Bugs;
