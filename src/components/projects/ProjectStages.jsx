import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Task, Project } from "@/api/entities"; // Import Task and Project entities
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Receipt,
  Users
} from "lucide-react";

const stages = [
  { key: "discovery", name: "Discovery & Requirements", percentage: 15 },
  { key: "design", name: "Design & Architecture", percentage: 20 },
  { key: "development", name: "Development & Configuration", percentage: 30 },
  { key: "testing", name: "Testing & QA", percentage: 15 },
  { key: "deployment", name: "Deployment & Implementation", percentage: 15 },
  { key: "training", name: "Training & Handoff", percentage: 5 }
];

export default function ProjectStages({ 
  project, 
  tasks, 
  onStageComplete, 
  onCreateTask, 
  userRole,
  invoiceLoading,
  onTasksUpdated, // Add this prop to refresh tasks after status change
  onProjectUpdated // Add this prop to refresh project after completion
}) {
  // Add task status change handler
  const handleTaskStatusChange = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      
      // Update completion date when marking as completed
      const updateData = {
        status: newStatus,
        ...(newStatus === "completed" && { completion_date: new Date().toISOString().split('T')[0] })
      };
      
      await Task.patch(taskId, updateData);
      
      // Call callback to refresh tasks in parent component
      if (onTasksUpdated) {
        onTasksUpdated();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      // You might want to show a toast notification here
    }
  };

  // Add project completion handler
  const handleProjectComplete = async (project) => {
    try {
      await Project.patch(project.id, { status: 'completed' });
      
      // Call callback to refresh project in parent component
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error) {
      console.error("Error completing project:", error);
      // You might want to show a toast notification here
    }
  };

  const getStageStatus = (stageKey) => {
    if (project.stage_completion?.[stageKey]) return "completed";
    if (project.current_stage === stageKey) return "active";
    return "pending";
  };

  const getStageTasks = (stageKey) => {
    return tasks.filter(task => task.stage === stageKey);
  };

  const getStageHours = (stageKey) => {
    return getStageTasks(stageKey).reduce((sum, task) => sum + (task.hours_logged || 0), 0);
  };

  // Check if all stages are completed
  const allStagesCompleted = stages.every(stage => 
    project.stage_completion?.[stage.key] === true
  );

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{project.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>{project.client_name}</span>
              <span>•</span>
              <span className="capitalize">{project.project_type?.replace('+', ' + ')}</span>
              {userRole !== "client" && project.total_fee && (
                <>
                  <span>•</span>
                  <span className="font-semibold">${project.total_fee.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          {userRole !== "client" && (
            <Button
              onClick={onCreateTask}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.key);
            const stageTasks = getStageTasks(stage.key);
            const completedTasks = stageTasks.filter(t => t.status === "completed").length;
            const stageHours = getStageHours(stage.key);
            const isCompleted = status === "completed";
            const isActive = status === "active";
            const canComplete = isActive && stageTasks.length > 0 && completedTasks === stageTasks.length;
            
            return (
              <div key={stage.key} className="relative">
                {index < stages.length - 1 && (
                  <div className={`absolute left-4 top-12 w-px h-16 ${
                    isCompleted ? "bg-green-500" : "bg-slate-200"
                  }`} />
                )}
                
                <div className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-blue-50 border border-blue-200" : 
                  isCompleted ? "bg-green-50 border border-green-200" : 
                  "bg-slate-50 border border-slate-200"
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-500 text-white" :
                    isActive ? "bg-blue-500 text-white" :
                    "bg-slate-300 text-slate-600"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{stage.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span>{stage.percentage}% of project fee</span>
                          {userRole !== "client" && project.total_fee && (
                            <span className="font-medium">
                              ${((project.total_fee * stage.percentage) / 100).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {stageTasks.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {completedTasks}/{stageTasks.length} tasks
                          </Badge>
                        )}
                        {stageHours > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {stageHours}h logged
                          </Badge>
                        )}
                      </div>
                    </div>

                    {stageTasks.length > 0 && (
                      <div className="space-y-2">
                        <Progress 
                          value={(completedTasks / stageTasks.length) * 100} 
                          className="h-2 bg-slate-200"
                        />
                        <div className="space-y-1">
                          {stageTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {/* Task completion checkbox - only show for non-client users */}
                                {userRole !== "client" ? (
                                  <input
                                    type="checkbox"
                                    checked={task.status === "completed"}
                                    onChange={() => handleTaskStatusChange(task.id, task.status)}
                                    className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                  />
                                ) : (
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.status === "completed" ? "bg-green-500" :
                                    task.status === "in_progress" ? "bg-blue-500" :
                                    "bg-slate-300"
                                  }`} />
                                )}
                                <span className={task.status === "completed" ? "text-slate-500 line-through" : "text-slate-700"}>
                                  {task.title}
                                </span>
                              </div>
                              {task.hours_logged > 0 && (
                                <span className="text-xs text-slate-500">{task.hours_logged}h</span>
                              )}
                            </div>
                          ))}
                          {stageTasks.length > 3 && (
                            <p className="text-xs text-slate-500">
                              +{stageTasks.length - 3} more tasks
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {userRole !== "client" && canComplete && !isCompleted && (
                      <Button
                        onClick={() => onStageComplete(project, stage.key)}
                        disabled={invoiceLoading[stage.key]}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        {invoiceLoading[stage.key] ? "Creating Invoice..." : "Complete Stage & Create Invoice"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Project completion section - moved outside the map */}
          {userRole !== "client" && allStagesCompleted && project.status !== 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-green-900">Ready to Complete Project</h4>
                  <p className="text-sm text-green-700">All stages completed. Mark project as finished?</p>
                </div>
                <Button 
                  onClick={() => handleProjectComplete(project)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Project
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}