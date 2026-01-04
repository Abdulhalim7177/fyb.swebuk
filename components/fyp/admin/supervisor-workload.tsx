"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface SupervisorWorkloadProps {
  workload: Array<{
    supervisor: {
      id: string;
      full_name: string;
      email: string;
    };
    total: number;
    active: number;
    completed: number;
  }>;
}

export function SupervisorWorkload({ workload }: SupervisorWorkloadProps) {
  if (workload.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supervisor Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No supervisors found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max for progress bar scaling
  const maxTotal = Math.max(...workload.map((w) => w.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervisor Workload Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workload.map((item) => {
            const progressPercent = (item.total / maxTotal) * 100;

            return (
              <div key={item.supervisor.id} className="space-y-3 p-3 rounded-lg border sm:border-0 sm:p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm sm:text-base">
                        {item.supervisor.full_name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.supervisor.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.supervisor.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <Badge variant="outline" className="shrink-0 h-6">
                      {item.total} Total
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shrink-0 h-6 hover:bg-orange-200">
                      {item.active} Active
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shrink-0 h-6 hover:bg-green-200">
                      {item.completed} Done
                    </Badge>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-1.5 sm:h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
