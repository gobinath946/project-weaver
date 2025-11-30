import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckSquare } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { Task } from '@/types';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await tasksApi.getAll();
        setTasks(response.data.data);
      } catch (error) {
        console.error('Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const priorityColors: Record<string, string> = {
    Low: 'bg-gray-500/10 text-gray-500',
    Medium: 'bg-blue-500/10 text-blue-500',
    High: 'bg-orange-500/10 text-orange-500',
    Critical: 'bg-red-500/10 text-red-500',
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Track and manage your tasks</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> New Task</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="h-5 w-48 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
            <p className="mt-2 text-muted-foreground">Create your first task to get started.</p>
            <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Create Task</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task._id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-muted'}`} />
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeof task.projectId === 'object' ? task.projectId.name : 'Unknown Project'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    {task.dueDate && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
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

export default Tasks;
