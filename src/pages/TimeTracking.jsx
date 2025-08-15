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
  const [selectedProject, setSelectedProject] = useState("all");
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

      // Load projects first
      let projectsData;
      if (userData.role === "staff" || userData.access_level === "staff") {
        // For staff users, get projects they have tasks assigned to
        const taskFilters = [
          { assigned_to: userData.email },
          { assigned_to: userData.id },
          { assignee: userData.email },
          { assignee: userData.id },
          { assigned_user: userData.id }
        ];
        
        let allTasks = [];
        
        // Try each filter until one works
        for (const filter of taskFilters) {
          try {
            allTasks = await Task.filter(filter, "-created_date");
            if (allTasks.length > 0) break;
          } catch (error) {
            continue;
          }
        }
        
        const projectIds = [...new Set(allTasks.map(task => task.project_id || task.project))];
        let allProjects = await Project.list("-updated_date");
        projectsData = allProjects.filter(project => projectIds.includes(project.id));
      } else {
        // For admin users, get all active projects
        projectsData = await Project.filter({ status: "active" });
      }

      // Load all tasks - we'll filter them in the UI based on selected project and user permissions
      let tasksData;
      if (userData.role === "staff" || userData.access_level === "staff") {
        // For staff, only get tasks assigned to them
        const taskFilters = [
          { assigned_to: userData.email },
          { assigned_to: userData.id },
          { assignee: userData.email },
          { assignee: userData.id },
          { assigned_user: userData.id }
        ];
        
        for (const filter of taskFilters) {
          try {
            tasksData = await Task.filter(filter, "-created_date");
            if (tasksData.length > 0) break;
          } catch (error) {
            continue;
          }
        }
        if (!tasksData) tasksData = [];
      } else {
        // For admin, get all tasks
        tasksData = await Task.list("-created_date");
      }

      // Load time entries
      const timeEntriesData = await TimeEntry.list("-created_date", 50);

      setProjects(projectsData);
      setTasks(tasksData);
      setTimeEntries(timeEntriesData);
      
      console.log('Loaded projects:', projectsData.length);
      console.log('Loaded tasks:', tasksData.length);
      console.log('User role/access:', userData.role, userData.access_level);
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
    
    // Calculate hours and round to 2 decimal places
    const hoursWorked = Math.round((currentTime / 3600) * 100) / 100;
    
    // Ensure minimum time entry (1 minute = 0.02 hours)
    const minimumHours = 0.02;
    const finalHours = hoursWorked < minimumHours ? minimumHours : hoursWorked;
    
    console.log('Timer details:', {
      currentTime,
      hoursWorked,
      finalHours,
      minimumHours
    });
    
    const timeEntryData = {
      project: timerProject,
      task: timerTask === "none" ? null : timerTask,
      user_email: user.email,
      hours: finalHours,
      description: timerDescription || `Timer session - ${project?.title}`,
      date: new Date().toISOString().split('T')[0],
      stage: project?.current_stage && ["discovery", "planning", "development", "testing", "deployment", "maintenance"].includes(project.current_stage) 
        ? project.current_stage 
        : "development"
    };
    
    console.log("Creating time entry with data:", timeEntryData);
    
    // Create the time entry first
    await TimeEntry.create(timeEntryData);
    console.log("Time entry created successfully");

    // Update task hours if task is selected
    if (task && timerTask !== "none") {
      try {
        const currentHours = typeof task.hours_logged === 'string' 
          ? parseFloat(task.hours_logged) || 0 
          : task.hours_logged || 0;
        
        const updatedHours = Number((currentHours + finalHours).toFixed(2));
        
        console.log('Updating task hours:', {
          taskId: task.id,
          currentHours,
          finalHours,
          updatedHours
        });
        
        await Task.patch(task.id, {
          hours_logged: updatedHours
        });
        
        console.log("Task hours updated successfully");
      } catch (taskError) {
        console.error("Error updating task hours (non-critical):", taskError);
        if (taskError.response) {
          console.error("Task update error data:", taskError.response.data);
        }
      }
    }

    // Update project total hours
    if (project) {
      try {
        const currentHours = typeof project.total_hours === 'string' 
          ? parseFloat(project.total_hours) || 0 
          : project.total_hours || 0;
        
        const updatedHours = Number((currentHours + finalHours).toFixed(2));
        
        console.log('Updating project hours:', {
          projectId: project.id,
          currentHours,
          finalHours,
          updatedHours
        });
        
        await Project.patch(project.id, {
          total_hours: updatedHours
        });
        
        console.log("Project hours updated successfully");
      } catch (projectError) {
        console.error("Error updating project hours (non-critical):", projectError);
        if (projectError.response) {
          console.error("Project update error data:", projectError.response.data);
        }
      }
    }

    // Reset timer state
    setCurrentTime(0);
    setTimerProject("");
    setTimerTask("");
    setTimerDescription("");
    
    // Reload data to show new entry
    loadData();
    
  } catch (error) {
    console.error("Error saving time entry:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    alert("Failed to save time entry. Please try again.");
  }
};

  const handleEntryAdded = () => {
    setShowAddEntry(false);
    loadData();
  };

  const getFilteredEntries = () => {
    let filtered = timeEntries;
    
    if (selectedProject && selectedProject !== "all") {
      filtered = filtered.filter(entry => 
        entry.project === selectedProject || entry.project_id === selectedProject
      );
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
                    <SelectItem value="none">No specific task</SelectItem>
                    {(() => {
                      const filteredTasks = tasks.filter(task => (task.project_id || task.project) === timerProject);
                      console.log('Filtering tasks for project:', timerProject, 'Found:', filteredTasks.length);
                      return filteredTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ));
                    })()}
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
              <SelectItem value="all">All Projects</SelectItem>
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