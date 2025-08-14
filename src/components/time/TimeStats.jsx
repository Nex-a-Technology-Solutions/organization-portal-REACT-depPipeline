import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, Target, Calendar } from "lucide-react";

export default function TimeStats({ timeEntries, projects, dateFilter }) {
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueProjects = new Set(timeEntries.map(entry => entry.project_id)).size;
  const avgHoursPerDay = timeEntries.length > 0 ? totalHours / Math.max(1, new Set(timeEntries.map(entry => entry.date)).size) : 0;
  
  const getDateLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "this_week": return "This Week";
      case "this_month": return "This Month";
      default: return "All Time";
    }
  };

  const stats = [
    {
      title: `Total Hours (${getDateLabel()})`,
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Active Projects",
      value: uniqueProjects,
      icon: Target,
      color: "text-green-600 bg-green-100"
    },
    {
      title: "Avg Hours/Day",
      value: `${avgHoursPerDay.toFixed(1)}h`,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-100"
    },
    {
      title: "Entries Logged",
      value: timeEntries.length,
      icon: Calendar,
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}