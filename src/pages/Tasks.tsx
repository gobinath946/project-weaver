import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { tasksApi, projectsApi } from '@/lib/api';
import { Task, Project } from '@/types';
import { Plus, Search, CheckSquare, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.getAll(),
        projectsApi.getAll(),
      ]);
      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' || task.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: 'bg-info/10 text-info border-info/20',
      Medium: 'bg-warning/10 text-warning border-warning/20',
      High: 'bg-destructive/10 text-destructive border-destructive/20',
      Critical: 'bg-destructive text-destructive-foreground',
    };
    return colors[priority as keyof typeof colors] || 'bg-muted';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'To Do': 'bg-muted text-muted-foreground',
      'In Progress': 'bg-info/10 text-info border-info/20',
      'Review': 'bg-warning/10 text-warning border-warning/20',
      'Done': 'bg-success/10 text-success border-success/20',
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage and track all your tasks</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare className="h-16 w-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-2xl font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first task'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task._id} className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {task.name}
                        </h3>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM dd')}
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

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchData} 
        projectId={selectedProject !== 'all' ? selectedProject : projects[0]?._id}
      />
    </MainLayout>
  );
};

export default Tasks;
