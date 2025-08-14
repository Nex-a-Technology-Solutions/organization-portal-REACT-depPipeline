import React, { useState, useEffect } from "react";
import { ProjectRequest } from "@/api/entities";
import { Client } from "@/api/entities";
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
import { Plus } from "lucide-react";

const projectTypes = [
  { key: "integrations", name: "System Integrations" },
  { key: "automations", name: "Business Automations" },
  { key: "automations+integrations", name: "Automations + Integrations" },
  { key: "apps", name: "Custom Applications" },
  { key: "websites", name: "Website Development" }
];

const budgetRanges = [
  { key: "under_5k", name: "Under $5,000" },
  { key: "5k_10k", name: "$5,000 - $10,000" },
  { key: "10k_25k", name: "$10,000 - $25,000" },
  { key: "25k_50k", name: "$25,000 - $50,000" },
  { key: "over_50k", name: "Over $50,000" }
];

export default function ProjectRequestDialog({ onClose, onRequestCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_type: "",
    budget_range: "",
    timeline: "",
    priority: "medium"
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.access_level === "client") {
        const clientRecord = await Client.filter({ user_id: userData.id }, 1);
        if (clientRecord.length > 0) {
          setClient(clientRecord[0]);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) {
      alert("Client information not found. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      await ProjectRequest.create({
        ...formData,
        client_id: client.id,
        client_name: client.name,
        client_email: client.email
      });

      onRequestCreated();
    } catch (error) {
      console.error("Error creating project request:", error);
      alert("Failed to submit request. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What would you like us to build or integrate?"
              required
            />
          </div>

          <div>
            <Label htmlFor="project_type">Project Type</Label>
            <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="What type of project is this?" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe what you need in detail. Include any specific requirements, integrations, or features you have in mind."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_range">Budget Range</Label>
              <Select value={formData.budget_range} onValueChange={(value) => setFormData({ ...formData, budget_range: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range.key} value={range.key}>
                      {range.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timeline">Desired Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g., 2-3 months, ASAP, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to have</SelectItem>
                <SelectItem value="medium">Medium - Important for business</SelectItem>
                <SelectItem value="high">High - Critical for operations</SelectItem>
                <SelectItem value="urgent">Urgent - Blocking current work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}