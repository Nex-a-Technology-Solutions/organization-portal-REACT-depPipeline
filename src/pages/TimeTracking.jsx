import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Square,
  Calendar,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import TimeEntryForm from "../components/time/TimeEntryForm";
import TimeEntryList from "../components/time/TimeEntryList";
import TimeStats from "../components/time/TimeStats";

export default function TimeTracking() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [dateFilter, setDateFilter] = useState("this_week");
  const [loading, setLoading] = useState(true);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerTask, setTimerTask] = useState("");
  const [timerDescription, setTimerDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime(time => time + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.access_level === "client") {
        setLoading(false);
        return;
      }

      const [projectsData, tasksData, timeEntriesData] = await Promise.all([
        Project.filter({ status: "active" }),
        Task.list("-created_date"),
        TimeEntry.list("-created_date", 50)
      ]);

      setProjects(projectsData);
      setTasks(tasksData);
      setTimeEntries(timeEntriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!timerProject) {
      alert("Please select a project first");
      return;
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = async () => {
    if (currentTime === 0) return;
    
    setIsRunning(false);
    
    try {
      const project = projects.find(p => p.id === timerProject);
      const task = tasks.find(t => t.id === timerTask);
      
      await TimeEntry.create({
        project_id: timerProject,
        task_id: timerTask || null,
        user_email: user.email,
        hours: currentTime / 3600,
        description: timerDescription || `Timer session - ${project?.title}`,
        date: new Date().toISOString().split('T')[0],
        stage: project?.current_stage || "development"
      });

      // Update task hours if task is selected
      if (task) {
        await Task.update(task.id, {
          hours_logged: (task.hours_logged || 0) + (currentTime / 3600)
        });
      }

      // Update project total hours
      if (project) {
        await Project.update(project.id, {
          total_hours: (project.total_hours || 0) + (currentTime / 3600)
        });
      }

      setCurrentTime(0);
      setTimerProject("");
      setTimerTask("");
      setTimerDescription("");
      loadData();
    } catch (error) {
      console.error("Error saving time entry:", error);
    }
  };

  const handleEntryAdded = () => {
    setShowAddEntry(false);
    loadData();
  };

  const getFilteredEntries = () => {
    let filtered = timeEntries;
    
    if (selectedProject) {
      filtered = filtered.filter(entry => entry.project_id === selectedProject);
    }

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(entry => 
          new Date(entry.date).toDateString() === new Date().toDateString()
        );
        break;
      case "this_week":
        filtered = filtered.filter(entry => new Date(entry.date) >= startOfWeek);
        break;
      case "this_month":
        filtered = filtered.filter(entry => new Date(entry.date) >= startOfMonth);
        break;
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="h-96 bg-slate-200 rounded-xl"></div>
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.access_level === "client") {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Time tracking is only available to admin and staff users.</p>
        </div>
      </div>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Time Tracking</h1>
            <p className="text-slate-600">Track time spent on projects and tasks</p>
          </div>
          <Button
            onClick={() => setShowAddEntry(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Time Entry
          </Button>
        </div>

        {/* Timer Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-slate-900 mb-4">
                {formatTime(currentTime)}
              </div>
              <div className="flex justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button 
                  onClick={stopTimer} 
                  variant="outline"
                  disabled={currentTime === 0}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop & Save
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Project</label>
                <Select value={timerProject} onValueChange={setTimerProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Task (Optional)</label>
                <Select value={timerTask} onValueChange={setTimerTask}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks
                      .filter(task => task.project_id === timerProject)
                      .map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <Input
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  placeholder="What are you working on?"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          <TimeStats 
            timeEntries={filteredEntries}
            projects={projects}
            dateFilter={dateFilter}
          />
        </div>

        <div className="flex gap-4 items-center">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TimeEntryList 
          timeEntries={filteredEntries}
          projects={projects}
          tasks={tasks}
        />

        {showAddEntry && (
          <TimeEntryForm
            projects={projects}
            tasks={tasks}
            user={user}
            onClose={() => setShowAddEntry(false)}
            onEntryAdded={handleEntryAdded}
          />
        )}
      </div>
    </div>
  );
}