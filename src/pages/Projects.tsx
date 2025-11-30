import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderKanban } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll();
        setProjects(response.data.data);
      } catch (error) {
        console.error('Failed to fetch projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    on_hold: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-blue-500/10 text-blue-500',
    archived: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your projects and teams</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 w-32 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-4 w-full bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
            <p className="mt-2 text-muted-foreground">Create your first project to get started.</p>
            <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project._id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={statusColors[project.status]}>{project.status}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description || 'No description'}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
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

export default Projects;
