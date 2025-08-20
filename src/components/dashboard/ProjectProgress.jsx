import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/api/entities";

const stages = [
  { key: "discovery", name: "Discovery & Requirements", percentage: 15 },
  { key: "design", name: "Design & Architecture", percentage: 20 },
  { key: "development", name: "Development & Configuration", percentage: 30 },
  { key: "testing", name: "Testing & QA", percentage: 15 },
  { key: "deployment", name: "Deployment & Implementation", percentage: 15 },
  { key: "training", name: "Training & Handoff", percentage: 5 }
];

const stageLabels = {
  discovery: "Discovery & Requirements",
  design: "Design & Architecture", 
  development: "Development & Configuration",
  testing: "Testing & QA",
  deployment: "Deployment & Implementation",
  training: "Training & Handoff"
};

export default function ProjectProgress({ projects }) {
  const [projectTasks, setProjectTasks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectTasks();
  }, [projects]);

  const loadProjectTasks = async () => {
    try {
      const tasksData = {};
      
      // Load tasks for each project
      for (const project of projects) {
        if (project.status === "active") {
          try {
            const tasks = await Task.filter({ project_id: project.id });
            tasksData[project.id] = tasks;
          } catch (error) {
            console.error(`Error loading tasks for project ${project.id}:`, error);
            tasksData[project.id] = [];
          }
        }
      }
      
      setProjectTasks(tasksData);
    } catch (error) {
      console.error("Error loading project tasks:", error);
    }
    setLoading(false);
  };

  // Calculate actual project progress based on completed stages AND task completion within current stage
  const calculateProjectProgress = (project) => {
    if (!project.stage_completion && !project.current_stage) return 0;
    
    let totalProgress = 0;
    const tasks = projectTasks[project.id] || [];
    
    // Add percentage for each completed stage
    stages.forEach(stage => {
      if (project.stage_completion?.[stage.key]) {
        totalProgress += stage.percentage;
      }
    });
    
    // Add partial progress for current stage based on task completion
    if (project.current_stage && !project.stage_completion?.[project.current_stage]) {
      const currentStage = stages.find(s => s.key === project.current_stage);
      if (currentStage) {
        const stageTasks = tasks.filter(task => task.stage === project.current_stage);
        if (stageTasks.length > 0) {
          const completedStageTasks = stageTasks.filter(task => task.status === "completed");
          const stageProgress = (completedStageTasks.length / stageTasks.length) * currentStage.percentage;
          totalProgress += stageProgress;
        }
      }
    }
    
    return Math.round(totalProgress);
  };

  // Get current stage status
  const getCurrentStageStatus = (project) => {
    if (!project.current_stage) return "Not Started";
    return stageLabels[project.current_stage] || project.current_stage;
  };

  // Get status badge variant based on project status
  const getStatusVariant = (project) => {
    switch (project.status) {
      case "completed":
        return "default"; // Green
      case "active":
        return "secondary"; // Blue
      case "on_hold":
        return "destructive"; // Red
      case "proposal":
        return "outline"; // Gray
      default:
        return "outline";
    }
  };

  // Get project status badge variant
  const getProjectStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "default";
      case "active":
        return "secondary";
      case "on_hold":
        return "destructive";
      case "proposal":
        return "outline";
      default:
        return "outline";
    }
  };

  // Filter to only show active projects (proposals don't have meaningful progress)
  const displayProjects = projects.filter(project => 
    project.status === "active"
  ).slice(0, 5); // Limit to 5 projects for better display

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-900">Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">Project Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {displayProjects.map((project) => {
            const progress = calculateProjectProgress(project);
            const currentStage = getCurrentStageStatus(project);
            const tasks = projectTasks[project.id] || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === "completed").length;
            
            return (
              <div key={project.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{project.title}</h4>
                    <p className="text-xs text-slate-500">{project.client_name}</p>
                    {totalTasks > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {completedTasks}/{totalTasks} tasks completed
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant={getStatusVariant(project)}
                      className="text-xs"
                    >
                      {currentStage}
                    </Badge>
                    <Badge 
                      variant={getProjectStatusVariant(project.status)} 
                      className="text-xs bg-slate-50 border-slate-200 text-slate-600"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={progress} 
                    className="h-2 bg-slate-100"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Overall Progress</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {displayProjects.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No active projects</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}