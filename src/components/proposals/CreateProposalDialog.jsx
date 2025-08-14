import React, { useState, useEffect, useRef } from "react";
import { Proposal } from "@/api/entities";
import { Client } from "@/api/entities";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
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
import { Sparkles, Upload, Loader2, UserPlus, List, FileText } from "lucide-react";

const projectTypes = [
  { key: "integrations", name: "System Integrations" },
  { key: "automations", name: "Business Automations" },
  { key: "automations+integrations", name: "Automations + Integrations" },
  { key: "apps", name: "Custom Applications" },
  { key: "websites", name: "Website Development" }
];

export default function CreateProposalDialog({ onClose, onProposalCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    client: "", // Django foreign key field
    project_type: "",
    description: "",
    total_fee: "",
    timeline: "",
    scope_of_work: ""
  });
  
  // Separate client data for new client creation
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    company: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [aiDocProcessing, setAiDocProcessing] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const fileInputRef = useRef(null);
  const [pastedText, setPastedText] = useState("");
  const [aiParsingText, setAiParsingText] = useState(false);
  const [selectedClientInfo, setSelectedClientInfo] = useState(null);

  const fetchClients = async () => {
    try {
      const response = await Client.getAll();
      // Handle both paginated and non-paginated responses
      const clientData = response.results || response;
      setClients(Array.isArray(clientData) ? clientData : []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client: client.id
      }));
      setSelectedClientInfo(client);
    }
  };

  const toggleNewClient = () => {
    const switchingToNew = !isNewClient;
    setIsNewClient(switchingToNew);
    
    if (switchingToNew) {
      // Clear existing client selection when switching to new client
      setFormData(prev => ({
        ...prev,
        client: ""
      }));
      setSelectedClientInfo(null);
    } else {
      // Clear new client data when switching to existing client
      setClientData({
        name: "",
        email: "",
        company: ""
      });
    }
  };

  const processParsedData = (data) => {
    // Attempt to match existing client by email
    let matchedClient = null;
    
    if (data.client_email) {
      matchedClient = clients.find(c => 
        c.email && c.email.toLowerCase() === data.client_email.toLowerCase()
      );
    }

    if (matchedClient) {
      // Found existing client
      setFormData(prev => ({
        ...prev,
        title: data.title || data.project_title || prev.title,
        project_type: data.project_type || prev.project_type,
        description: data.description || prev.description,
        scope_of_work: data.scope_of_work || prev.scope_of_work,
        total_fee: data.total_fee ? data.total_fee.toString() : prev.total_fee,
        timeline: data.timeline || prev.timeline,
        client: matchedClient.id
      }));
      setSelectedClientInfo(matchedClient);
      setIsNewClient(false);
    } else {
      // No existing client found, prepare for new client creation
      setFormData(prev => ({
        ...prev,
        title: data.title || data.project_title || prev.title,
        project_type: data.project_type || prev.project_type,
        description: data.description || prev.description,
        scope_of_work: data.scope_of_work || prev.scope_of_work,
        total_fee: data.total_fee ? data.total_fee.toString() : prev.total_fee,
        timeline: data.timeline || prev.timeline,
        client: ""
      }));
      
      setClientData({
        name: data.client_name || "",
        email: data.client_email || "",
        company: data.client_company || ""
      });
      
      if (data.client_email || data.client_name) {
        setIsNewClient(true);
      }
    }
  };

  const handleDocumentUpload = async (file) => {
    setDocumentFile(file);
    setAiDocProcessing(true);
    
    try {
      const { file_url } = await UploadFile({ file });
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            project_title: { type: "string" },
            client_name: { type: "string" },
            client_email: { type: "string" },
            client_company: { type: "string" },
            project_type: { type: "string", enum: projectTypes.map(p => p.key) },
            description: { type: "string" },
            scope_of_work: { type: "string" },
            total_fee: { type: "number" },
            timeline: { type: "string" },
          }
        }
      });

      if (extractResult.status === "success" && extractResult.output) {
        processParsedData(extractResult.output);
      }
    } catch (error) {
      console.error("Error processing document:", error);
      alert("AI processing failed. Please fill the form manually.");
    }
    
    setAiDocProcessing(false);
  };
  
  const handleParseText = async () => {
    if (!pastedText.trim()) {
      alert("Please paste the proposal text into the text area first.");
      return;
    }
    
    setAiParsingText(true);
    try {
      const parsedData = await InvokeLLM({
        prompt: `You are a data extraction tool. Read the following text and extract the specified information into a JSON object. Do not invent, infer, or modify any data. If a piece of information is not present, leave the corresponding field in the JSON null. If multiple matches are found for a string field, return the most prominent one. For project_type, use one of the following exact keys: ${projectTypes.map(p => p.key).join(', ')}. If none match, return null. Here is the text to parse: \n\n---START TEXT---\n${pastedText}\n---END TEXT---`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The main title of the project." },
            client_name: { type: "string", description: "The full name of the client contact." },
            client_email: { type: "string", description: "The email address of the client." },
            client_company: { type: "string", description: "The company name of the client." },
            project_type: { type: "string", enum: projectTypes.map(p => p.key), description: "The type of project. Must be one of the provided enum values." },
            description: { type: "string", description: "A summary or high-level description of the project." },
            scope_of_work: { type: "string", description: "The detailed scope of work, including all deliverables and phases." },
            total_fee: { type: "number", description: "The total numerical fee for the project." },
            timeline: { type: "string", description: "The estimated project timeline (e.g., '8-12 weeks')." },
          }
        }
      });
      
      if (parsedData) {
        processParsedData(parsedData);
      }

    } catch(error) {
      console.error("Error parsing text with AI:", error);
      alert("AI text parsing failed. Please check the text and try again, or fill the form manually.");
    }
    setAiParsingText(false);
  };

  const handleAIGenerate = async () => {
    if (!formData.project_type || !formData.description) {
      alert("Please select project type and provide description first");
      return;
    }

    setAiLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `Generate a detailed, professional scope of work for a ${formData.project_type} project. 
        
        Project description: ${formData.description}
        
        Create a comprehensive scope that includes:
        - Project overview
        - Key deliverables
        - Technical requirements
        - Implementation phases
        - Success criteria
        
        Make it professional and detailed for a tech systems integration company.`,
        response_json_schema: {
          type: "object",
          properties: {
            scope_of_work: { type: "string" },
            suggested_timeline: { type: "string" }
          }
        }
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          scope_of_work: result.scope_of_work || prev.scope_of_work,
          timeline: result.suggested_timeline || prev.timeline
        }));
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      alert("AI generation failed. Please try again or fill manually.");
    }
    setAiLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalClientId = formData.client;

      // Create new client if in new client mode
      if (isNewClient) {
        if (!clientData.name || !clientData.email) {
          alert("Client Name and Email are required for a new client.");
          setLoading(false);
          return;
        }
        
        try {
          const newClient = await Client.create({
            name: clientData.name,
            email: clientData.email,
            company: clientData.company || ""
          });
          finalClientId = newClient.id;
          
          // Refresh client list for future use
          await fetchClients();
        } catch (clientError) {
          console.error("Error creating client:", clientError);
          let errorMessage = "Failed to create new client.";
          
          if (clientError.response?.data) {
            const errors = clientError.response.data;
            if (typeof errors === 'object') {
              const errorMessages = Object.entries(errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n');
              errorMessage = `Client creation failed:\n${errorMessages}`;
            }
          }
          
          alert(errorMessage);
          setLoading(false);
          return;
        }
      } else if (!finalClientId) {
        alert("Please select an existing client or switch to 'Add New Client' to create one.");
        setLoading(false);
        return;
      }
      
      // Set valid_until to 30 days from now
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // Prepare proposal data according to Django model
      const proposalData = {
        title: formData.title,
        client: finalClientId, // Foreign key to Client
        project_type: formData.project_type,
        description: formData.description,
        scope_of_work: formData.scope_of_work || "",
        total_fee: parseFloat(formData.total_fee) || 0,
        timeline: formData.timeline || "",
        valid_until: validUntil.toISOString().split('T')[0], // Format as YYYY-MM-DD
        status: "draft" // Set default status
      };

      // Remove empty values
      Object.keys(proposalData).forEach(key => {
        if (proposalData[key] === "" || proposalData[key] === null || proposalData[key] === undefined) {
          if (key !== 'scope_of_work' && key !== 'timeline') { // Keep these even if empty
            delete proposalData[key];
          }
        }
      });

      console.log('Sending proposal data:', proposalData);

      await Proposal.create(proposalData);
      onProposalCreated();
      onClose();
      
    } catch (error) {
      console.error("Error creating proposal:", error);
      
      // Enhanced error handling
      let errorMessage = "Failed to create proposal. Please try again.";
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              const msgText = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msgText}`;
            })
            .join('\n');
          errorMessage = `Validation errors:\n${errorMessages}`;
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
        </DialogHeader>

        {/* AI Processing Indicators */}
        {aiDocProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 my-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">AI is processing your proposal document...</span>
          </div>
        )}
        
        {aiParsingText && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 my-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">AI is parsing your pasted text...</span>
          </div>
        )}

        {/* AI Input Section */}
        <div className="space-y-6">
          {/* Document Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={aiDocProcessing || aiParsingText}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document for AI-Fill
              </Button>
              <p className="text-sm text-gray-500">
                Upload a draft, email, or requirements document.
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
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleDocumentUpload(file);
              }}
              className="hidden"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          
          {/* Text Parsing */}
          <div className="space-y-3">
            <Label htmlFor="paste-area">Paste Text for AI-Fill</Label>
            <Textarea
              id="paste-area"
              placeholder="Paste your full proposal text here, and the AI will break it down and pre-fill the form for you."
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="bg-slate-50"
              disabled={aiDocProcessing || aiParsingText}
            />
            <Button 
              type="button"
              onClick={handleParseText}
              disabled={aiParsingText || aiDocProcessing || !pastedText.trim()}
              className="w-full"
            >
              {aiParsingText ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {aiParsingText ? "Parsing Text..." : "Parse Text with AI"}
            </Button>
          </div>
        </div>
        
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t">
          {/* Title and Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
                required
              />
            </div>
            <div>
              <Label htmlFor="total_fee">Total Fee ($)</Label>
              <Input
                id="total_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_fee}
                onChange={(e) => setFormData({ ...formData, total_fee: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Client Section */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="client">Client</Label>
              <Button 
                type="button" 
                variant="link" 
                onClick={toggleNewClient} 
                className="h-auto p-0 text-sm"
                disabled={aiDocProcessing || aiParsingText}
              >
                {isNewClient ? (
                  <>
                    <List className="w-3 h-3 mr-1" />
                    Select Existing Client
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Add New Client
                  </>
                )}
              </Button>
            </div>
            
            {!isNewClient ? (
              <>
                <Select value={formData.client} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an existing client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Display selected client info */}
                {selectedClientInfo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                    <p><strong>Name:</strong> {selectedClientInfo.name}</p>
                    <p><strong>Email:</strong> {selectedClientInfo.email}</p>
                    {selectedClientInfo.company && (
                      <p><strong>Company:</strong> {selectedClientInfo.company}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 border bg-slate-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-slate-700">New Client Details</p>
                <Input
                  placeholder="Client Name"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Client Email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Company Name (Optional)"
                  value={clientData.company}
                  onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Project Type */}
          <div>
            <Label htmlFor="project_type">Project Type</Label>
            <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
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

          {/* Description */}
          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project requirements"
              rows={3}
              required
            />
          </div>

          {/* Scope of Work with AI Generate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="scope_of_work">Scope of Work</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAIGenerate}
                disabled={aiLoading || !formData.project_type || !formData.description || aiDocProcessing || aiParsingText}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {aiLoading ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <Textarea
              id="scope_of_work"
              value={formData.scope_of_work}
              onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
              placeholder="Detailed scope of work will be generated here..."
              rows={8}
            />
          </div>

          {/* Timeline */}
          <div>
            <Label htmlFor="timeline">Project Timeline</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="e.g., 8-12 weeks"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || aiDocProcessing || aiLoading || aiParsingText} 
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {loading ? "Creating..." : "Create Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}