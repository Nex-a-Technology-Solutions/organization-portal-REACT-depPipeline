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
  { key: "design", name: "Design & Architecture" },
  { key: "development", name: "Development & Configuration" },
  { key: "testing", name: "Testing & QA" },
  { key: "deployment", name: "Deployment & Implementation" },
  { key: "training", name: "Training & Handoff" }
];

export default function TimeEntryForm({ projects, tasks, user, onClose, onEntryAdded }) {
  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    hours: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    stage: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await TimeEntry.create({
        ...formData,
        user_email: user.email,
        hours: parseFloat(formData.hours),
        task_id: formData.task_id || null
      });

      // Update task hours if task is selected
      if (formData.task_id) {
        const task = tasks.find(t => t.id === formData.task_id);
        if (task) {
          await Task.update(task.id, {
            hours_logged: (task.hours_logged || 0) + parseFloat(formData.hours)
          });
        }
      }

      // Update project total hours
      if (formData.project_id) {
        const project = projects.find(p => p.id === formData.project_id);
        if (project) {
          await Project.update(project.id, {
            total_hours: (project.total_hours || 0) + parseFloat(formData.hours)
          });
        }
      }

      onEntryAdded();
    } catch (error) {
      console.error("Error creating time entry:", error);
    }
    setLoading(false);
  };

  const projectTasks = tasks.filter(task => task.project_id === formData.project_id);
  const selectedProject = projects.find(p => p.id === formData.project_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project_id">Project</Label>
            <Select 
              value={formData.project_id} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                project_id: value, 
                task_id: "", 
                stage: projects.find(p => p.id === value)?.current_stage || ""
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
            <Label htmlFor="task_id">Task (Optional)</Label>
            <Select 
              value={formData.task_id} 
              onValueChange={(value) => setFormData({ ...formData, task_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No specific task</SelectItem>
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