
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Client } from "@/api/entities"; // Added import for Client entity
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Send,
  FolderOpen
} from "lucide-react";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectStages from "../components/projects/ProjectStages";
import CreateTaskDialog from "../components/projects/CreateTaskDialog";

export default function Projects() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      console.log('User data:', userData); // Debug log

      let projectsData;
      if (userData.access_level === "client") {
        const clientRecord = await Client.filter({ user_id: userData.id }, 1);
        if (clientRecord.length > 0) {
          projectsData = await Project.filter({ client_id: clientRecord[0].id }, "-updated_date");
        } else {
          projectsData = [];
        }
      } else if (userData.role === "staff" || userData.access_level === "staff") {
        // Try both role and access_level to be safe
        // Also try different field names for assigned user
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
            console.log(`Tasks found with filter:`, filter, allTasks); // Debug log
            if (allTasks.length > 0) break;
          } catch (error) {
            console.log(`Filter failed:`, filter, error);
            continue;
          }
        }
        
        const projectIds = [...new Set(allTasks.map(task => task.project_id || task.project))];
        console.log('Project IDs for staff:', projectIds); // Debug log
        
        let allProjects = await Project.list("-updated_date");
        projectsData = allProjects.filter(project => projectIds.includes(project.id));
        console.log('Filtered projects for staff:', projectsData); // Debug log
      } else {
        projectsData = await Project.list("-updated_date");
      }
      
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
        // Fix the task loading here too
        const tasksData = (userData.role === "staff" || userData.access_level === "staff")
          ? await Task.filter({ 
              project_id: projectsData[0].id, 
              assigned_to: userData.email // Try the field name that worked above
            }, "-created_date")
          : await Task.filter({ project_id: projectsData[0].id }, "-created_date");
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesType = filterType === "all" || project.project_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    
    // Use consistent field names
    const tasksData = (user?.role === "staff" || user?.access_level === "staff")
      ? await Task.filter({ 
          project_id: project.id, // Consistent with above
          assigned_to: user.email // Use the same field name that worked
        }, "-created_date")
      : await Task.filter({ project_id: project.id }, "-created_date");
    setTasks(tasksData);
  };

  const handleStageComplete = async (project, stage) => {
    setInvoiceLoading(prev => ({ ...prev, [stage]: true }));
    
    try {
      // Generate AI invoice description
      const stageDescriptions = {
        discovery: "Discovery & Requirements Analysis",
        design: "System Design & Architecture",
        development: "Development & Configuration",
        testing: "Testing & Quality Assurance", 
        deployment: "Deployment & Implementation",
        training: "Training & Handoff"
      };

      const stagePercentages = {
        discovery: 15,
        design: 20,
        development: 30,
        testing: 15,
        deployment: 15,
        training: 5
      };

      const aiDescription = await InvokeLLM({
        prompt: `Generate a professional invoice description for the "${stageDescriptions[stage]}" phase of a ${project.project_type} project titled "${project.title}" for client "${project.client_name}". 
        
        Include specific deliverables and work completed in this phase. Be detailed and professional. 
        
        Project context: ${project.description}`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" }
          }
        }
      });

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}`;
      const amount = (project.total_fee * stagePercentages[stage]) / 100;
      
      await Invoice.create({
        project_id: project.id,
        project_description: project.description, // Added project description
        invoice_number: invoiceNumber,
        client_name: project.client_name,
        client_email: project.client_email || "",
        stage: stage,
        stage_description: aiDescription.description,
        amount: amount,
        percentage: stagePercentages[stage],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Update project stage completion
      const updatedStageCompletion = { ...project.stage_completion, [stage]: true };
      await Project.update(project.id, { 
        stage_completion: updatedStageCompletion,
        current_stage: getNextStage(stage)
      });

      // Refresh data
      loadData();
      
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
    
    setInvoiceLoading(prev => ({ ...prev, [stage]: false }));
  };

  const getNextStage = (currentStage) => {
    const stages = ["discovery", "design", "development", "testing", "deployment", "training"];
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : "training";
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

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#F2F2F2] to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1E1D] mb-2">Projects</h1>
            <p className="text-gray-600 font-medium">Manage your integration and automation projects</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 backdrop-blur-sm border-gray-200 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-white/90 backdrop-blur-sm border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-white/90 backdrop-blur-sm border-gray-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="integrations">Integrations</SelectItem>
                <SelectItem value="automations">Automations</SelectItem>
                <SelectItem value="automations+integrations">Automations + Integrations</SelectItem>
                <SelectItem value="apps">Apps</SelectItem>
                <SelectItem value="websites">Websites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1E1E1D] text-lg">
              Projects ({filteredProjects.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={selectedProject?.id === project.id}
                  onClick={() => handleProjectSelect(project)}
                  userRole={user?.access_level}
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="font-medium">No projects found</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <ProjectStages
                project={selectedProject}
                tasks={tasks}
                onStageComplete={handleStageComplete}
                onCreateTask={() => setShowCreateTask(true)}
                userRole={user?.access_level}
                invoiceLoading={invoiceLoading}
              />
            ) : (
              <Card className="h-96 flex items-center justify-center bg-white/90 backdrop-blur-sm border-gray-200">
                <div className="text-center text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Select a project to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {showCreateTask && selectedProject && (
          <CreateTaskDialog
            project={selectedProject}
            onClose={() => setShowCreateTask(false)}
            onTaskCreated={loadData}
          />
        )}
      </div>
    </div>
  );
}
