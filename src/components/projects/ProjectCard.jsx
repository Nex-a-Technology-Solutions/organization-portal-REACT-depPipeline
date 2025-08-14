
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  proposal: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const typeColors = {
  integrations: "bg-purple-100 text-purple-800 border-purple-200",
  automations: "bg-blue-100 text-blue-800 border-blue-200",
  "automations+integrations": "bg-indigo-100 text-indigo-800 border-indigo-200",
  apps: "bg-green-100 text-green-800 border-green-200",
  websites: "bg-orange-100 text-orange-800 border-orange-200"
};

const stageProgress = {
  discovery: 15,
  design: 35,
  development: 65,
  testing: 80,
  deployment: 95,
  training: 100
};

export default function ProjectCard({ project, isSelected, onClick, userRole }) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 rounded-lg border-l-4 ${
        isSelected 
          ? "border-green-500 bg-white shadow-lg" 
          : "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
              {project.title}
            </h4>
            <p className="text-xs text-slate-500">{project.client_name}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={`text-xs ${statusColors[project.status]}`}>
              {project.status?.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={`text-xs ${typeColors[project.project_type]}`}>
              {project.project_type?.replace('+', ' + ')}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="capitalize">{project.current_stage?.replace('_', ' ')}</span>
            <span>{stageProgress[project.current_stage] || 0}%</span>
          </div>
          <Progress 
            value={stageProgress[project.current_stage] || 0} 
            className="h-1.5 bg-slate-100" 
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          {userRole !== "client" && project.total_fee && (
            <span className="flex items-center gap-1 font-medium">
              <DollarSign className="w-3 h-3" />
              ${project.total_fee.toLocaleString()}
            </span>
          )}
          {project.total_hours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.total_hours}h
            </span>
          )}
          {project.start_date && (
            <span>
              Started {format(new Date(project.start_date), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
