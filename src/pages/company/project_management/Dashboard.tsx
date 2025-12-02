import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { PriorityBadge } from "@/components/project-management/PriorityBadge";
import { projectServices } from "@/api/services";
import { format, differenceInDays } from "date-fns";
import { CheckCircle2, Circle, Bug, Target, Clock, AlertTriangle, ListTodo } from "lucide-react";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await projectServices.getDashboardStats();
      return response.data.data;
    },
  });

  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const response = await projectServices.getMyTasks({ limit: 10 });
      return response.data.data;
    },
  });

  const { data: dueToday, isLoading: dueTodayLoading } = useQuery({
    queryKey: ["due-today"],
    queryFn: async () => {
      const response = await projectServices.getDueToday();
      return response.data.data;
    },
  });

  const { data: overdue, isLoading: overdueLoading } = useQuery({
    queryKey: ["overdue-items"],
    queryFn: async () => {
      const response = await projectServices.getOverdueItems();
      return response.data.data;
    },
  });


  const statCards = [
    { title: "Open Tasks", value: stats?.open_tasks || 0, icon: Circle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Closed Tasks", value: stats?.closed_tasks || 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Open Bugs", value: stats?.open_bugs || 0, icon: Bug, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Closed Bugs", value: stats?.closed_bugs || 0, icon: Bug, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Milestones", value: stats?.milestones || 0, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <DashboardLayout title="Project Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            statCards.map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo className="h-5 w-5" />
                My Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : myTasks?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks assigned</p>
              ) : (
                <div className="space-y-2">
                  {myTasks?.map((task: any) => (
                    <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.name}</p>
                        <p className="text-xs text-muted-foreground">{task.project_id?.title}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due Today */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dueTodayLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (!dueToday?.tasks?.length && !dueToday?.bugs?.length) ? (
                <p className="text-muted-foreground text-center py-8">Nothing due today</p>
              ) : (
                <div className="space-y-2">
                  {dueToday?.tasks?.map((task: any) => (
                    <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-xs text-muted-foreground">{task.project_id?.title}</p>
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                  {dueToday?.bugs?.map((bug: any) => (
                    <div key={bug._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium">{bug.title}</p>
                          <p className="text-xs text-muted-foreground">{bug.project_id?.title}</p>
                        </div>
                      </div>
                      <StatusBadge status={bug.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Overdue Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (!overdue?.tasks?.length && !overdue?.bugs?.length) ? (
              <p className="text-muted-foreground text-center py-8">No overdue items</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdue?.tasks?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Tasks</h4>
                    {overdue.tasks.map((task: any) => {
                      const daysOverdue = differenceInDays(new Date(), new Date(task.due_date));
                      return (
                        <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.name}</p>
                            <p className="text-xs text-muted-foreground">{task.project_id?.title}</p>
                          </div>
                          <Badge variant="destructive" className="ml-2">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
                {overdue?.bugs?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Bugs</h4>
                    {overdue.bugs.map((bug: any) => {
                      const daysOverdue = differenceInDays(new Date(), new Date(bug.due_date));
                      return (
                        <div key={bug._id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{bug.title}</p>
                            <p className="text-xs text-muted-foreground">{bug.project_id?.title}</p>
                          </div>
                          <Badge variant="destructive" className="ml-2">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
