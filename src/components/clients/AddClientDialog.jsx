import React, { useState, useRef, useEffect } from "react";
import { Client } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile, sendExternalEmail } from "@/api/integrations";
import { Settings } from "@/api/entities";
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
import { Upload, Camera, Loader2, Copy, Check } from "lucide-react";

export default function AddClientDialog({ onClose, onClientAdded }) {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    billing_address: ""
  });
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const fileInputRef = useRef(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await Settings.list();
        if (settingsData && settingsData.length > 0) {
          setSettings(settingsData[0]);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleFileUpload = async (file) => {
    setDocumentFile(file);
    setAiProcessing(true);
    
    try {
      const { file_url } = await UploadFile({ file });
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            company: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            billing_address: { type: "string" }
          }
        }
      });

      if (extractResult.status === "success" && extractResult.output) {
        const data = extractResult.output;
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          company: data.company || prev.company,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          billing_address: data.billing_address || prev.billing_address,
        }));
      }
    } catch (error) {
      console.error("Error processing document:", error);
      alert("AI processing failed. Please fill the form manually.");
    }
    
    setAiProcessing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newClient = await Client.create(formData);
      
      const appUrl = window.location.origin;

      const emailBody = `Hi ${formData.name},

You've been invited to the client portal for ${settings?.company_name || 'our company'}.

To access your projects, invoices, and updates, please sign in using the link below:
${appUrl}

Important: You must use this exact email address (${formData.email}) to sign in, as it has been pre-authorized for access.

We look forward to collaborating with you.

Best regards,
The ${settings?.company_name || 'Nex-a'} Team`;

      // Use the sendExternalEmail function to handle both Gmail and default mailer
      await sendExternalEmail({
        to: formData.email,
        subject: `Welcome to the ${settings?.company_name || 'Nex-a'} Client Portal`,
        body: emailBody
      });

      onClientAdded(newClient);
    } catch (error) {
      console.error("Error adding client:", error);
      alert("Failed to add client. An invitation may have already been sent to this email. Please check and try again.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        {aiProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 my-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">AI is processing your document...</span>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center my-4">
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={aiProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document for AI-Fill
            </Button>
            <p className="text-sm text-gray-500">
              Upload a business card, email signature, or contact sheet.
            </p>
            {documentFile && (
              <p className="text-sm font-medium text-green-600">
                Uploaded: {documentFile.name}
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@acme.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              placeholder="123 Main St, Anytown, USA 12345"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || aiProcessing}
              className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}