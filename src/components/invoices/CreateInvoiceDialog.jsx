import React, { useState, useEffect } from "react";
import { Invoice } from "@/api/entities";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function CreateInvoiceDialog({ projects, onClose, onInvoiceCreated }) {
  const [formData, setFormData] = useState({
    project: "", // Changed from project_id to project (matches Django field)
    invoice_number: "",
    amount: "",
    due_date: "",
    stage_description: "",
    stage: "planning", // Use valid choice from Django model
    percentage: 0, // Add percentage field as required by Django
  });
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  const generateInvoiceNumber = async () => {
    try {
      // Get existing invoices to find the next number
      const existingInvoices = await Invoice.list("-created_date", 100);
      const invoiceNumbers = existingInvoices
        .map(inv => {
          const match = inv.invoice_number.match(/INV-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      const nextNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) + 1 : 1;
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      
      setFormData(prev => ({
        ...prev,
        invoice_number: `INV-${paddedNumber}`
      }));
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Fallback to timestamp-based number if fetching fails
      const fallbackNumber = (Date.now() % 10000).toString().padStart(4, '0');
      setFormData(prev => ({
        ...prev,
        invoice_number: `INV-${fallbackNumber}`
      }));
    }
  };

  useEffect(() => {
    if (formData.project) {
      const project = projects.find(p => p.id === formData.project);
      setSelectedProject(project);
    } else {
      setSelectedProject(null);
    }
  }, [formData.project, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, let's log the form data to see what we have
      console.log("Form data:", formData);
      console.log("Available projects:", projects);
      
      // Find the selected project
      const project = projects.find(p => p.id === formData.project);
      if (!project) {
        alert('Please select a project');
        setLoading(false);
        return;
      }

      console.log('Selected project:', project);

      // Since your Django model auto-populates client info from project,
      // but still requires the client foreign key, let's include it
      const invoiceData = {
        project: formData.project,
        client: project.client, // Add the client UUID from project
        invoice_number: formData.invoice_number,
        stage: formData.stage,
        stage_description: formData.stage_description,
        amount: formData.amount, // Send as string first to see if Django converts it
        percentage: "0", // Send as string
        due_date: formData.due_date
      };

      console.log('Minimal invoice data being sent:', invoiceData);

      const response = await Invoice.create(invoiceData);
      console.log('Success response:', response);

      onInvoiceCreated();
      onClose();
      
    } catch (error) {
      console.error("Full error object:", error);
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
        console.error("Error response headers:", error.response.headers);
      }
      
      if (error.request) {
        console.error("Error request:", error.request);
      }
      
      console.error("Error message:", error.message);
      
      // Show a simple alert for now
      alert("Failed to create invoice. Check console for details.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Manual Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select 
              value={formData.project} 
              onValueChange={(value) => setFormData({ ...formData, project: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
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

          {/* Display client info if project is selected */}
          {selectedProject && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <p><strong>Client:</strong> {selectedProject.client_name}</p>
              {selectedProject.client_email && (
                <p><strong>Email:</strong> {selectedProject.client_email}</p>
              )}
              {selectedProject.description && (
                <p><strong>Project:</strong> {selectedProject.description}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(new Date(formData.due_date), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={(date) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : "" })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="stage">Project Stage</Label>
            <Select 
              value={formData.stage} 
              onValueChange={(value) => setFormData({ ...formData, stage: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description / Items</Label>
            <Textarea
              id="description"
              value={formData.stage_description}
              onChange={(e) => setFormData({ ...formData, stage_description: e.target.value })}
              placeholder="e.g., Additional consulting hours, software license, etc."
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}