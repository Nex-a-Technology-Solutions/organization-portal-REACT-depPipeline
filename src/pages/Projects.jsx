import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Client } from "@/api/entities";
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

// Define stages that match your backend model - using the working configuration from file 1
const stages = [
  { key: "discovery", name: "Discovery & Requirements", percentage: 15 },
  { key: "design", name: "Design & Architecture", percentage: 20 }, // This maps to 'planning' in backend
  { key: "development", name: "Development & Configuration", percentage: 30 },
  { key: "testing", name: "Testing & QA", percentage: 15 },
  { key: "deployment", name: "Deployment & Implementation", percentage: 15 },
  { key: "training", name: "Training & Handoff", percentage: 5 } // This maps to 'maintenance' in backend
];

// Map frontend stage names to backend stage names
const stageMapping = {
  "discovery": "discovery",
  "design": "planning", // Frontend 'design' = Backend 'planning'
  "development": "development",
  "testing": "testing",
  "deployment": "deployment",
  "training": "maintenance" // Frontend 'training' = Backend 'maintenance'
};

// Reverse mapping for backend to frontend
const reverseStageMapping = {
  "discovery": "discovery",
  "planning": "design",
  "development": "development", 
  "testing": "testing",
  "deployment": "deployment",
  "maintenance": "training"
};

// AI Configuration for business use cases
const AI_CONFIG = {
  financial: {
    model: "gpt-4o-mini",
    temperature: 0.3, 
    max_tokens: 800
  }
};

// Enhanced AI invoice generation with structured output
const generateInvoiceDescription = async (project, frontendStage) => {
  const stageDescriptions = {
    discovery: "Discovery & Requirements Analysis",
    design: "System Design & Architecture",
    development: "Development & Configuration",
    testing: "Testing & Quality Assurance", 
    deployment: "Deployment & Implementation",
    training: "Training & Handoff"
  };

  try {
    const aiDescription = await InvokeLLM({
      prompt: `Generate a professional invoice description for the "${stageDescriptions[frontendStage]}" phase of a ${project.project_type} project titled "${project.title}" for client "${project.client_name}". 
      
      Project context: ${project.description}
      
      Requirements:
      - Use formal business language
      - Include 3-5 specific deliverables for this phase
      - Mention measurable outcomes where applicable
      - Keep description between 100-200 words
      - Focus on value provided to the client
      - Be specific about work completed in this ${stageDescriptions[frontendStage]} phase`,
      
      response_json_schema: {
        type: "object",
        properties: {
          description: { 
            type: "string",
            description: "Professional invoice description (100-200 words)"
          },
          deliverables: {
            type: "array",
            items: { type: "string" },
            description: "List of 3-5 key deliverables for this phase"
          },
          hours_justification: {
            type: "string", 
            description: "Brief justification for time spent on this phase"
          }
        },
        required: ["description", "deliverables"]
      },
      
      // Optimized settings for financial documents
      ...AI_CONFIG.financial
    });
    
    // Validate the response has required business data
    if (!aiDescription.description || aiDescription.description.length < 50) {
      throw new Error("AI generated description too short for professional invoice");
    }
    
    return aiDescription;
    
  } catch (error) {
    console.warn("AI description generation failed, using professional fallback:", error);
    
    // CRITICAL: Always have a professional fallback for financial documents
    const fallbackDeliverables = {
      discovery: [
        "Requirements analysis and documentation",
        "System architecture design",
        "Project timeline and milestones",
        "Technical specification document",
        "Stakeholder alignment sessions"
      ],
      design: [
        "System architecture design",
        "Technical specifications",
        "UI/UX design mockups",
        "Database schema design",
        "Integration planning documents"
      ],
      development: [
        "Core system development",
        "Feature implementation",
        "Code documentation",
        "Development environment setup",
        "Progress reviews and updates"
      ],
      testing: [
        "Comprehensive testing suite",
        "Quality assurance protocols",
        "Bug identification and resolution",
        "Performance validation",
        "Test documentation"
      ],
      deployment: [
        "Production deployment",
        "System configuration",
        "Go-live support",
        "Deployment documentation",
        "Post-deployment validation"
      ],
      training: [
        "User training sessions",
        "Documentation handoff",
        "Knowledge transfer",
        "Support procedures setup",
        "Project closure activities"
      ]
    };

    return {
      description: `Professional ${stageDescriptions[frontendStage]} services completed for ${project.title}. This phase included comprehensive ${frontendStage} activities delivered according to project specifications and industry best practices. All deliverables were completed to client satisfaction with full documentation and quality assurance measures implemented throughout the process.`,
      deliverables: fallbackDeliverables[frontendStage] || [
        `${stageDescriptions[frontendStage]} documentation`,
        "Quality assurance review",
        "Client communication and updates",
        "Technical implementation",
        "Testing and validation"
      ],
      hours_justification: `Time allocated according to project scope and complexity for ${stageDescriptions[frontendStage]} phase, ensuring thorough delivery of all requirements.`
    };
  }
};

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

      let projectsData;
      if (userData.access_level === "client") {
        const clientRecord = await Client.filter({ user_id: userData.id }, 1);
        if (clientRecord.length > 0) {
          projectsData = await Project.filter({ client_id: clientRecord[0].id }, "-updated_date");
        } else {
          projectsData = [];
        }
      } else if (userData.role === "staff" || userData.access_level === "staff") {
        const taskFilters = [
          { assigned_to: userData.email },
          { assigned_to: userData.id },
          { assignee: userData.email },
          { assignee: userData.id },
          { assigned_user: userData.id }
        ];
        
        let allTasks = [];
        
        for (const filter of taskFilters) {
          try {
            allTasks = await Task.filter(filter, "-created_date");
            if (allTasks.length > 0) break;
          } catch (error) {
            console.log(`Filter failed:`, filter, error);
            continue;
          }
        }
        
        const projectIds = [...new Set(allTasks.map(task => task.project_id || task.project))];
        
        let allProjects = await Project.list("-updated_date");
        projectsData = allProjects.filter(project => projectIds.includes(project.id));
      } else {
        projectsData = await Project.list("-updated_date");
      }
      
      // Transform projects to use frontend stage names
      projectsData = projectsData.map(project => ({
        ...project,
        current_stage: reverseStageMapping[project.current_stage] || project.current_stage,
        stage_completion: transformStageCompletion(project.stage_completion, reverseStageMapping)
      }));
      
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
        const tasksData = (userData.role === "staff" || userData.access_level === "staff")
          ? await Task.filter({ 
              project_id: projectsData[0].id, 
              assigned_to: userData.email
            }, "-created_date")
          : await Task.filter({ project_id: projectsData[0].id }, "-created_date");
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  // Helper function to transform stage completion between frontend and backend
  const transformStageCompletion = (stageCompletion, mapping) => {
    if (!stageCompletion) return {};
    
    const transformed = {};
    Object.keys(stageCompletion).forEach(key => {
      const mappedKey = mapping[key] || key;
      transformed[mappedKey] = stageCompletion[key];
    });
    return transformed;
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
    
    const tasksData = (user?.role === "staff" || user?.access_level === "staff")
      ? await Task.filter({ 
          project_id: project.id,
          assigned_to: user.email
        }, "-created_date")
      : await Task.filter({ project_id: project.id }, "-created_date");
    setTasks(tasksData);
  };

  const handleTasksUpdated = async () => {
    if (selectedProject && user) {
      try {
        const tasksData = (user?.role === "staff" || user?.access_level === "staff")
          ? await Task.filter({ 
              project: selectedProject.id,
              assigned_to: user.email
            }, "-created_date")
          : await Task.filter({ project: selectedProject.id }, "-created_date");
        
        setTasks(tasksData);
      } catch (error) {
        console.error("Error refreshing tasks:", error);
      }
    }
  };

  const handleProjectUpdated = async () => {
    try {
      await loadData();
      
      if (selectedProject) {
        const updatedProject = await Project.get(selectedProject.id);
        // Transform the updated project
        const transformedProject = {
          ...updatedProject,
          current_stage: reverseStageMapping[updatedProject.current_stage] || updatedProject.current_stage,
          stage_completion: transformStageCompletion(updatedProject.stage_completion, reverseStageMapping)
        };
        setSelectedProject(transformedProject);
      }
    } catch (error) {
      console.error("Error refreshing project:", error);
    }
  };

  const handleStageComplete = async (project, frontendStage) => {
    setInvoiceLoading(prev => ({ ...prev, [frontendStage]: true }));
    
    try {
      // Map frontend stage to backend stage
      const backendStage = stageMapping[frontendStage];
      
      const stagePercentages = {
        discovery: 15,
        design: 20,
        development: 30,
        testing: 15,
        deployment: 15,
        training: 5
      };

      // Generate enhanced AI invoice description
      let aiDescription;
      try {
        aiDescription = await generateInvoiceDescription(project, frontendStage);
      } catch (error) {
        console.warn("AI description generation failed, using fallback:", error);
        aiDescription = { 
          description: `Professional ${frontendStage} services completed for ${project.title}`,
          deliverables: [`${frontendStage} phase completion`],
          hours_justification: `Standard time allocation for ${frontendStage} phase`
        };
      }

      // Create invoice with enhanced data
      try {
        const invoiceNumber = `INV-${Date.now()}`;
        const amount = (project.total_fee * stagePercentages[frontendStage]) / 100;
        
        const invoiceData = {
          project: project.id,
          client: project.client,
          project_description: project.description || "",
          invoice_number: invoiceNumber,
          client_name: project.client_name || "",
          client_email: project.client_email || "",
          stage: backendStage, // Use backendStage instead of frontendStage
          stage_description: aiDescription.description || `Professional ${frontendStage} services completed for ${project.title}`,
          amount: parseFloat(amount.toFixed(2)),
          percentage: stagePercentages[frontendStage],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        const invoiceResult = await Invoice.create(invoiceData);
        
      } catch (error) {
        console.error("Invoice creation failed - Full error:", error);
        
        // Log the specific validation errors if available
        if (error.response?.data) {
          console.error("Backend validation errors:", JSON.stringify(error.response.data, null, 2));
        }
        
        // Continue with stage completion even if invoice fails
      }

      // Use the apiClient from your client.js for the complete_stage endpoint
      try {
        const { djangoClient } = await import("@/api/client");
        const apiClient = djangoClient.getClient();
        
        const stageResponse = await apiClient.patch(`/projects/${project.id}/complete_stage/`, {
          stage: backendStage
        });
        
        // Refresh data
        await loadData();
        
      } catch (stageError) {
        console.error("Error completing stage:", stageError);
        console.error("Stage error response:", stageError.response?.data);
        throw stageError; // Re-throw to be caught by outer try-catch
      }
      
    } catch (error) {
      console.error("Error completing stage:", error);
      // You might want to show a toast notification here
    }
    
    setInvoiceLoading(prev => ({ ...prev, [frontendStage]: false }));
  };

  const getNextStage = (currentBackendStage) => {
    const backendStages = ["discovery", "planning", "development", "testing", "deployment", "maintenance"];
    const currentIndex = backendStages.indexOf(currentBackendStage);
    return currentIndex < backendStages.length - 1 ? backendStages[currentIndex + 1] : "maintenance";
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
                onTasksUpdated={handleTasksUpdated}
                onProjectUpdated={handleProjectUpdated}
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