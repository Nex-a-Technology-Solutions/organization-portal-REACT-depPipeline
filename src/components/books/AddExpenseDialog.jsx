import React, { useState, useRef } from "react";
import { Expense } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Camera, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

const categories = [
  { key: "office_supplies", name: "Office Supplies" },
  { key: "software", name: "Software" },
  { key: "hardware", name: "Hardware" },
  { key: "travel", name: "Travel" },
  { key: "meals", name: "Meals" },
  { key: "utilities", name: "Utilities" },
  { key: "rent", name: "Rent" },
  { key: "marketing", name: "Marketing" },
  { key: "training", name: "Training" },
  { key: "other", name: "Other" }
];

export default function AddExpenseDialog({ projects, onClose, onExpenseAdded }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    project_id: "",
    tax_deductible: true,
    notes: ""
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const fileInputRef = useRef(null);

const handleFileUpload = async (file) => {
  setReceiptFile(file);
  setAiProcessing(true);
  
  try {
    // Upload the file first
    const uploadResult = await UploadFile({ file });
    
    // Extract file path and URL from upload response
    const fileUrl = uploadResult.file_url;
    const filePath = uploadResult.file_path;
    
    if (!fileUrl && !filePath) {
      throw new Error('No file URL or path returned from upload');
    }
    
    // Call the extraction endpoint with correct parameters
    const extractResult = await ExtractDataFromUploadedFile(fileUrl, {
      file_path: filePath, // Include file_path for direct file reading
      json_schema: {
        type: "object",
        properties: {
          vendor: { type: ["string", "null"] },
          amount: { type: ["number", "null"] },
          date: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          category: { 
            type: ["string", "null"],
            enum: [...categories.map(c => c.key), null]
          }
        },
        additionalProperties: false
      }
    });


    if (extractResult.status === "success" && extractResult.output) {
      const data = extractResult.output;
      setFormData(prev => ({
        ...prev,
        title: data.description || prev.title,
        amount: data.amount ? data.amount.toString() : prev.amount,
        vendor: data.vendor || prev.vendor,
        date: data.date || prev.date,
        category: data.category || prev.category,
        receipt_url: fileUrl,
        extracted_data: data
      }));
      
      // Show success message with extracted fields
      const extractedFields = Object.entries(data)
        .filter(([key, value]) => value !== null && value !== "" && value !== undefined)
        .map(([key]) => key)
        .join(', ');
      
      if (extractedFields) {
        alert(`Successfully extracted from receipt: ${extractedFields}`);
      }
    } else if (extractResult.error) {
      console.error('Extraction failed:', extractResult.error);
      alert(`AI processing failed: ${extractResult.error}`);
    } else {
      console.warn('No data extracted from receipt');
      alert('AI could not extract meaningful information from this receipt. Please fill the form manually.');
    }
  } catch (error) {
    console.error("Error processing receipt:", error);
    
    let errorMessage = "AI processing failed. ";
    if (error.response?.data?.error) {
      errorMessage += error.response.data.error;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again or fill the form manually.";
    }
    
    alert(errorMessage);
  }
  
  setAiProcessing(false);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = null;
      
      if (receiptFile && !formData.receipt_url) {
        const { file_url } = await UploadFile({ file: receiptFile });
        receiptUrl = file_url;
      }

      await Expense.create({
        ...formData,
        amount: parseFloat(formData.amount),
        project_id: formData.project_id || null,
        receipt_url: receiptUrl || formData.receipt_url
      });

      onExpenseAdded();
    } catch (error) {
      console.error("Error creating expense:", error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        
        {aiProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">AI is processing your receipt...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={aiProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) handleFileUpload(file);
                    };
                    input.click();
                  }}
                  disabled={aiProcessing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Upload a receipt or take a photo - AI will automatically extract the details
              </p>
              {receiptFile && (
                <p className="text-sm font-medium text-green-600">
                  Receipt uploaded: {receiptFile.name}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Description</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What was this expense for?"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Vendor/merchant name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, date: date.toISOString().split('T')[0] })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this expense"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax_deductible"
              checked={formData.tax_deductible}
              onCheckedChange={(checked) => setFormData({ ...formData, tax_deductible: checked })}
            />
            <Label htmlFor="tax_deductible" className="text-sm font-medium">
              Tax deductible expense
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || aiProcessing} 
              className="bg-[#1E1E1D] hover:bg-gray-800"
            >
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}