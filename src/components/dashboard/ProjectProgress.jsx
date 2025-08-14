import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const stageProgress = {
  discovery: 15,
  design: 35,
  development: 65,
  testing: 80,
  deployment: 95,
  training: 100
};

const stageLabels = {
  discovery: "Discovery & Requirements",
  design: "Design & Architecture", 
  development: "Development & Configuration",
  testing: "Testing & QA",
  deployment: "Deployment & Implementation",
  training: "Training & Handoff"
};

export default function ProjectProgress({ projects }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">Project Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{project.title}</h4>
                  <p className="text-xs text-slate-500">{project.client_name}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs bg-slate-50 border-slate-200 text-slate-600"
                >
                  {stageLabels[project.current_stage]}
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress 
                  value={stageProgress[project.current_stage] || 0} 
                  className="h-2 bg-slate-100"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{stageProgress[project.current_stage] || 0}%</span>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No active projects</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}