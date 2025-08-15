import React, { useState } from "react";
import { TimeEntry } from "@/api/entities";
import { Task } from "@/api/entities";
import { Project } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stages = [
  { key: "discovery", name: "Discovery & Requirements" },
  { key: "planning", name: "Design & Architecture" },
  { key: "development", name: "Development & Configuration" },
  { key: "testing", name: "Testing & QA" },
  { key: "deployment", name: "Deployment & Implementation" },
  { key: "maintenance", name: "Training & Handoff" }
];

export default function TimeEntryForm({ projects, tasks, user, onClose, onEntryAdded }) {
  const [formData, setFormData] = useState({
    project: "",
    task: "",
    hours: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    stage: "development" // Default stage
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating time entry with data:', {
        project: formData.project,
        task: formData.task || null,
        user_email: user.email,
        hours: parseFloat(formData.hours),
        description: formData.description,
        date: formData.date,
        stage: formData.stage
      });

      await TimeEntry.create({
        project: formData.project,
        task: formData.task || null,
        user_email: user.email,
        hours: parseFloat(formData.hours),
        description: formData.description,
        date: formData.date,
        stage: formData.stage
      });

      // Update task hours if task is selected
      if (formData.task) {
        try {
          const task = tasks.find(t => t.id === formData.task);
          if (task) {
            const currentHours = typeof task.hours_logged === 'string' 
              ? parseFloat(task.hours_logged) || 0 
              : task.hours_logged || 0;
            
            const updatedHours = Number((currentHours + parseFloat(formData.hours)).toFixed(2));
            
            console.log('Updating task hours:', {
              taskId: task.id,
              currentHours,
              addedHours: parseFloat(formData.hours),
              updatedHours
            });

            await Task.patch(task.id, {
              hours_logged: updatedHours
            });
            
            console.log('Task hours updated successfully');
          }
        } catch (taskError) {
          console.error("Error updating task hours (non-critical):", taskError);
        }
      }

      // Update project total hours
      if (formData.project) {
        try {
          const project = projects.find(p => p.id === formData.project);
          if (project) {
            const currentHours = typeof project.total_hours === 'string' 
              ? parseFloat(project.total_hours) || 0 
              : project.total_hours || 0;
            
            const updatedHours = Number((currentHours + parseFloat(formData.hours)).toFixed(2));
            
            console.log('Updating project hours:', {
              projectId: project.id,
              currentHours,
              addedHours: parseFloat(formData.hours),
              updatedHours
            });

            await Project.patch(project.id, {
              total_hours: updatedHours
            });
            
            console.log('Project hours updated successfully');
          }
        } catch (projectError) {
          console.error("Error updating project hours (non-critical):", projectError);
        }
      }

      onEntryAdded();
    } catch (error) {
      console.error("Error creating time entry:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      alert("Failed to create time entry. Please try again.");
    }
    setLoading(false);
  };

  // Filter tasks for the selected project - handle both project and project_id fields
  const projectTasks = tasks.filter(task => 
    (task.project && task.project === formData.project) || 
    (task.project_id && task.project_id === formData.project)
  );
  
  const selectedProject = projects.find(p => p.id === formData.project);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select 
              value={formData.project} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                project: value, 
                task: "", // Reset task when project changes
                stage: projects.find(p => p.id === value)?.current_stage || "development"
              })}
            >
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
            <Label htmlFor="task">Task (Optional)</Label>
            <Select 
              value={formData.task} 
              onValueChange={(value) => setFormData({ ...formData, task: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific task</SelectItem>
                {projectTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stage">Project Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.key} value={stage.key}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.25"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="0.0"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}