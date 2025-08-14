import React, { useState } from "react";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
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

export default function CreateTaskDialog({ project, onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stage: project.current_stage || "discovery",
    hours_estimated: "",
    assigned_to: ""
  });
  const [loading, setLoading] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  React.useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    setLoadingUsers(true);
    setUserError(null);
    
    try {
      // Get all users and filter for staff/admin (non-client) users
      const allUsers = await User.list("-created_date");
      const teamUsers = allUsers.filter(user => user.access_level !== 'client');
      setStaffUsers(teamUsers);
    } catch (error) {
      console.error("Error loading staff users:", error);
      setUserError("Failed to load team members");
      
      // Fallback: try the original filter approach
      try {
        const users = await User.filter({ access_level: "staff" });
        setStaffUsers(users);
        setUserError(null);
      } catch (fallbackError) {
        console.error("Fallback error loading staff users:", fallbackError);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        project: project.id, // Use 'project' instead of 'project_id'
        stage: formData.stage,
        status: 'pending', // Explicitly set status
        hours_estimated: parseFloat(formData.hours_estimated) || 0,
        assigned_to: formData.assigned_to || null // Handle empty assignment
      };

      console.log("Creating task with data:", taskData);
      
      await Task.create(taskData);

      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Extract validation errors
      if (error.response?.data) {
        console.error("Validation errors:", error.response.data);
        
        // Create user-friendly error message
        let errorMsg = "Failed to create task: ";
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMsg += errors;
        } else {
          errorMsg += error.response.data;
        }
        setSubmitError(errorMsg);
      } else {
        setSubmitError("An unexpected error occurred while creating the task");
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
              rows={3}
            />
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

          <div>
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select 
              value={formData.assigned_to} 
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingUsers 
                    ? "Loading team members..." 
                    : userError 
                    ? "Error loading team members" 
                    : "Select team member"
                } />
              </SelectTrigger>
              <SelectContent>
                {staffUsers.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    <div className="flex items-center gap-2">
                      <span>{user.full_name}</span>
                      <span className="text-xs text-gray-500 capitalize">({user.access_level})</span>
                    </div>
                  </SelectItem>
                ))}
                {staffUsers.length === 0 && !loadingUsers && (
                  <SelectItem value="" disabled>
                    No team members available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {userError && (
              <p className="text-sm text-red-500 mt-1">{userError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="hours_estimated">Estimated Hours</Label>
            <Input
              id="hours_estimated"
              type="number"
              min="0"
              step="0.5"
              value={formData.hours_estimated}
              onChange={(e) => setFormData({ ...formData, hours_estimated: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingUsers} className="bg-slate-900 hover:bg-slate-800">
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
          
          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}