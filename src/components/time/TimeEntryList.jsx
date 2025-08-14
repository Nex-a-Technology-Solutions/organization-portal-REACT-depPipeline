import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, User, Calendar } from "lucide-react";

const stageColors = {
  discovery: "bg-blue-100 text-blue-800",
  design: "bg-purple-100 text-purple-800",
  development: "bg-green-100 text-green-800",
  testing: "bg-yellow-100 text-yellow-800",
  deployment: "bg-orange-100 text-orange-800",
  training: "bg-pink-100 text-pink-800"
};

export default function TimeEntryList({ timeEntries, projects, tasks }) {
  if (timeEntries.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-500">No time entries found for the selected filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Entries ({timeEntries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeEntries.map((entry) => {
            const project = projects.find(p => p.id === entry.project_id);
            const task = tasks.find(t => t.id === entry.task_id);
            
            return (
              <div key={entry.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{project?.title || "Unknown Project"}</h4>
                    {task && (
                      <p className="text-sm text-slate-600">{task.title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={stageColors[entry.stage] || "bg-gray-100 text-gray-800"}>
                      {entry.stage?.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{entry.hours.toFixed(2)}h</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.date), "MMM d")}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-700 mb-2">{entry.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3 h-3" />
                  <span>{entry.user_email}</span>
                  <span>•</span>
                  <span>{format(new Date(entry.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}