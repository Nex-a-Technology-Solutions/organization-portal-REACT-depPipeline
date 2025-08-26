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
    
    // Found existing client - use extracted data preferentially
    setFormData(prev => {
      const newFormData = {
        ...prev,
        title: data.title || data.project_title || prev.title,
        project_type: data.project_type || prev.project_type,
        description: data.description || prev.description,
        scope_of_work: data.scope_of_work || prev.scope_of_work,
        total_fee: data.total_fee ? data.total_fee.toString() : prev.total_fee,
        timeline: data.timeline || prev.timeline,
        client: matchedClient.id
      };
      
      return newFormData;
    });
    
    setSelectedClientInfo(matchedClient);
    setIsNewClient(false);
  } else {
    
    // No existing client found, prepare for new client creation
    setFormData(prev => {
      const newFormData = {
        ...prev,
        title: data.title || data.project_title || prev.title,
        project_type: data.project_type || prev.project_type,
        description: data.description || prev.description,
        scope_of_work: data.scope_of_work || prev.scope_of_work,
        total_fee: data.total_fee ? data.total_fee.toString() : prev.total_fee,
        timeline: data.timeline || prev.timeline,
        client: ""
      };
      return newFormData;
    });
    
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
    // First, upload the file
    const uploadResult = await UploadFile({ file });
    console.log('Upload result:', uploadResult);
    
    // Extract file path and URL from upload response
    const fileUrl = uploadResult.file_url;
    const filePath = uploadResult.file_path;
    
    if (!fileUrl && !filePath) {
      throw new Error('No file URL or path returned from upload');
    }
    
    // Call the extraction endpoint with both file_url and file_path
    const extractResult = await ExtractDataFromUploadedFile(fileUrl, {
      file_path: filePath, // Include file_path for direct file reading
      json_schema: {
        type: "object",
        properties: {
          title: { type: ["string", "null"] },
          project_title: { type: ["string", "null"] },
          client_name: { type: ["string", "null"] },
          client_email: { type: ["string", "null"] },
          client_company: { type: ["string", "null"] },
          project_type: { 
            type: ["string", "null"], 
            enum: [...projectTypes.map(p => p.key), null] 
          },
          description: { type: ["string", "null"] },
          scope_of_work: { type: ["string", "null"] },
          total_fee: { type: ["number", "null"] },
          timeline: { type: ["string", "null"] },
        },
        additionalProperties: false
      }
    });

    console.log('Extract result:', extractResult);

    if (extractResult.status === "success" && extractResult.output) {
      processParsedData(extractResult.output);
      
      // Show success message with extracted fields
      const extractedFields = Object.entries(extractResult.output)
        .filter(([key, value]) => value !== null && value !== "" && value !== undefined)
        .map(([key]) => key)
        .join(', ');
      
      if (extractedFields) {
        alert(`✅ Successfully extracted from document: ${extractedFields}`);
      }
    } else if (extractResult.error) {
      console.error('Extraction failed:', extractResult.error);
      alert(`AI processing failed: ${extractResult.error}`);
    } else {
      console.warn('No data extracted from document');
      alert('AI could not extract meaningful information from this document. Please try a different file or fill the form manually.');
    }
  } catch (error) {
    console.error("Error processing document:", error);
    
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
  
  setAiDocProcessing(false);
};
// Improved handleParseText function with better error handling and debugging
// Enhanced handleParseText with better prompting and fallback extraction
const handleParseText = async () => {
  if (!pastedText.trim()) {
    alert("Please paste the proposal text into the text area first.");
    return;
  }
  
  
  setAiParsingText(true);
  try {
    // Pre-analysis with regex patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const moneyRegex = /(?:\$|USD|dollars?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
    
    const foundEmails = pastedText.match(emailRegex) || [];
    const foundMoney = pastedText.match(moneyRegex) || [];
    
    // Create a more aggressive extraction prompt
    const extractionPrompt = `TASK: Extract business proposal information from the provided text.

INSTRUCTIONS:
- Be VERY LIBERAL in your interpretation
- If something MIGHT be a project title, extract it
- If you see ANY name mentioned, consider it a potential client name  
- If you see ANY business/company mentioned, extract it
- For project type, look for keywords like: API, integration, automation, workflow, website, web, app, application, system, database, etc.
- Extract ANY dollar amounts, numbers that could be fees
- Extract ANY time references (days, weeks, months)
- If information seems incomplete, make reasonable assumptions
- Don't return null unless absolutely nothing is found

PROJECT TYPE MAPPING:
- "integrations" = API connections, system integrations, third-party connections
- "automations" = workflows, process automation, business automation  
- "automations+integrations" = combination projects
- "apps" = software development, custom applications, mobile apps
- "websites" = web development, website creation, web applications

TEXT TO ANALYZE:
---START TEXT---
${pastedText}
---END TEXT---

EXTRACT as much as possible into this JSON structure:`;


    const response = await InvokeLLM({
      prompt: extractionPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { 
            type: ["string", "null"], 
            description: "Any text that could be a project title, subject, or heading" 
          },
          client_name: { 
            type: ["string", "null"], 
            description: "Any person's name mentioned in the text" 
          },
          client_email: { 
            type: ["string", "null"], 
            description: "Any email address found" 
          },
          client_company: { 
            type: ["string", "null"], 
            description: "Any company, business, or organization name" 
          },
          project_type: { 
            type: ["string", "null"], 
            enum: [...projectTypes.map(p => p.key), null],
            description: "Map content keywords to project categories" 
          },
          description: { 
            type: ["string", "null"], 
            description: "Main project description or requirements" 
          },
          scope_of_work: { 
            type: ["string", "null"], 
            description: "Detailed work breakdown, deliverables, or tasks" 
          },
          total_fee: { 
            type: ["number", "null"], 
            description: "Any monetary amount mentioned" 
          },
          timeline: { 
            type: ["string", "null"], 
            description: "Any time references or deadlines" 
          },
        },
        additionalProperties: false
      },
      temperature: 0.1, // Lower temperature for more consistent extraction
      max_tokens: 2000
    });
    

    // Handle both parsed JSON response and raw text response
    let parsedData;
    if (response?.result && typeof response.result === 'string') {
      // Response has a result property with JSON string - this is your case
      try {
        parsedData = JSON.parse(response.result);
      } catch (parseError) {
        console.error('Failed to parse JSON from result property:', parseError);
        alert('AI returned invalid JSON format in result. Please try again.');
        return;
      }
    } else if (typeof response === 'object' && response !== null && !response.result) {
      // Response is already parsed JSON object
      parsedData = response;
    } else if (typeof response === 'string') {
      // Response is a JSON string, try to parse it
      try {
        parsedData = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        alert('AI returned invalid JSON format. Please try again.');
        return;
      }
    } else {
      console.error('Unexpected response format:', response);
      alert('AI returned unexpected response format. Please try again.');
      return;
    }

    
    if (parsedData && typeof parsedData === 'object') {
      // Apply regex fallbacks for obvious patterns AI might have missed
      const enhancedData = { ...parsedData };
      
      // Email fallback
      if (!enhancedData.client_email && foundEmails.length > 0) {
        enhancedData.client_email = foundEmails[0];
      }
      
      // Money fallback
      if (!enhancedData.total_fee && foundMoney.length > 0) {
        const cleanAmount = foundMoney[0].replace(/[^\d.]/g, '');
        const numericAmount = parseFloat(cleanAmount);
        if (!isNaN(numericAmount)) {
          enhancedData.total_fee = numericAmount;
        }
      }
      
      // Smart title extraction if missing
      if (!enhancedData.title && pastedText.length < 200) {
        // If text is short, use the whole thing as potential title
        const lines = pastedText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          enhancedData.title = lines[0].trim().substring(0, 100);
        }
      }
      
      // Project type inference from keywords
      if (!enhancedData.project_type) {
        const text = pastedText.toLowerCase();
        if (text.includes('api') || text.includes('integration') || text.includes('connect')) {
          enhancedData.project_type = 'integrations';
        } else if (text.includes('automation') || text.includes('workflow') || text.includes('process')) {
          enhancedData.project_type = 'automations';
        } else if (text.includes('website') || text.includes('web')) {
          enhancedData.project_type = 'websites';
        } else if (text.includes('app') || text.includes('software') || text.includes('system')) {
          enhancedData.project_type = 'apps';
        }
        
        if (enhancedData.project_type) {
          console.log('🎯 Applied project type inference:', enhancedData.project_type);
        }
      }
      
      // Check if we extracted anything useful
      const extractedValues = Object.values(enhancedData).filter(value => 
        value !== null && value !== "" && value !== undefined
      );
      
      if (extractedValues.length > 0) {
        processParsedData(enhancedData);
        
        // Show success feedback
        const extractedFields = Object.entries(enhancedData)
          .filter(([key, value]) => value !== null && value !== "" && value !== undefined)
          .map(([key]) => key)
          .join(', ');
        
        alert(`✅ Successfully extracted: ${extractedFields}`);
      } else {
        console.warn('⚠️ No meaningful data extracted');
        alert('AI could not extract meaningful information from the provided text. The text might be too short, unclear, or not contain proposal-related information. Please try:\n\n1. Adding more context to your text\n2. Including specific details like amounts, names, or project descriptions\n3. Filling the form manually');
      }
    } else {
      console.error('❌ Invalid parsed data format:', parsedData);
      alert("AI parsing returned invalid data format. Please try again or fill the form manually.");
    }

  } catch(error) {
    console.error("💥 Error in AI text parsing:", error);
    
    let errorMessage = "AI text parsing failed. ";
    if (error.response?.data?.error) {
      errorMessage += error.response.data.error;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again or fill the form manually.";
    }
    
    alert(errorMessage);
  } finally {
    setAiParsingText(false);
  }
};

// Alternative simpler extraction for very minimal text
const handleSimpleParseText = async () => {
  if (!pastedText.trim()) {
    alert("Please paste some text first.");
    return;
  }
  
  setAiParsingText(true);
  
  try {
    // For very simple/short text, use a different approach
    const simplePrompt = `You have this text: "${pastedText}"

This appears to be related to a business proposal or project request. 

Based on this text, fill out as much information as you can reasonably infer:

1. What could be the project title?
2. What type of project is this? (choose: integrations, automations, apps, websites, or automations+integrations)
3. What is the project about?
4. Any client information mentioned?
5. Any costs or timeline mentioned?

Be creative and make reasonable assumptions. If "Server setup for nexa" was the text, you might infer:
- Title: "Server Setup Project" 
- Type: "integrations" (server work often involves system integration)
- Description: "Server infrastructure setup and configuration for Nexa"

Return your analysis as JSON:`;

    const result = await InvokeLLM({
      prompt: simplePrompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: ["string", "null"] },
          client_name: { type: ["string", "null"] },
          client_email: { type: ["string", "null"] },
          client_company: { type: ["string", "null"] },
          project_type: { type: ["string", "null"], enum: [...projectTypes.map(p => p.key), null] },
          description: { type: ["string", "null"] },
          scope_of_work: { type: ["string", "null"] },
          total_fee: { type: ["number", "null"] },
          timeline: { type: ["string", "null"] },
        }
      }
    });
    
    if (result) {
      processParsedData(result);
    }
    
  } catch (error) {
    console.error("Simple parsing failed:", error);
    alert("Text parsing failed. Please fill the form manually.");
  } finally {
    setAiParsingText(false);
  }
};

const handleAIGenerate = async () => {
  if (!formData.project_type || !formData.description) {
    alert("Please select project type and provide description first");
    return;
  }

  setAiLoading(true);
  try {
    const response = await InvokeLLM({
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


    // Handle different response formats
    let result;
    if (response?.result && typeof response.result === 'string') {
      // Response has a result property with JSON string
      try {
        result = JSON.parse(response.result);
      } catch (parseError) {
        console.error('Failed to parse JSON from result property:', parseError);
        alert('AI returned invalid JSON format. Please try again.');
        setAiLoading(false);
        return;
      }
    } else if (typeof response === 'object' && response !== null && (response.scope_of_work || response.suggested_timeline)) {
      // Response is already the parsed object
      result = response;
    } else if (typeof response === 'string') {
      // Response is a JSON string
      try {
        result = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        alert('AI returned invalid JSON format. Please try again.');
        setAiLoading(false);
        return;
      }
    } else {
      console.error('Unexpected AI generate response format:', response);
      alert('AI returned unexpected response format. Please try again.');
      setAiLoading(false);
      return;
    }

    if (result && (result.scope_of_work || result.suggested_timeline)) {

      setFormData(prev => {
        const updated = {
          ...prev,
          scope_of_work: result.scope_of_work || prev.scope_of_work,
          timeline: result.suggested_timeline || prev.timeline
        };
        
        return updated;
      });

      // Show success message
      const generatedFields = [];
      if (result.scope_of_work) generatedFields.push('Scope of Work');
      if (result.suggested_timeline) generatedFields.push('Timeline');
      
      if (generatedFields.length > 0) {
        alert(`✅ AI Generated: ${generatedFields.join(' and ')}`);
      }
    } else {
      console.warn('⚠️ AI response missing expected fields:', result);
      alert('AI generated content but it was empty. Please try again.');
    }
  } catch (error) {
    console.error("💥 Error generating AI content:", error);
    
    let errorMessage = "AI generation failed. ";
    if (error.response?.data?.error) {
      errorMessage += error.response.data.error;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please try again or fill manually.";
    }
    
    alert(errorMessage);
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