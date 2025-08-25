import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Check, Send, FileText, DollarSign, Calendar, ExternalLink, Loader2, Zap } from "lucide-react";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800"
};

export default function ProposalViewer({ proposal, onAccept, onSendToClient, userRole, generatingContent, acceptingProposal }) {
  const stages = [
    { name: "Discovery & Requirements", percentage: 15 },
    { name: "Design & Architecture", percentage: 20 },
    { name: "Development & Configuration", percentage: 30 },
    { name: "Testing & QA", percentage: 15 },
    { name: "Deployment & Implementation", percentage: 15 },
    { name: "Training & Handoff", percentage: 5 }
  ];

  const proposalUrl = `${window.location.origin}/proposal/${proposal.id}`;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{proposal.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>{proposal.client_name}</span>
              <span>•</span>
              <span>{proposal.client_email}</span>
              <span>•</span>
              <span className="capitalize">{proposal.project_type?.replace('+', ' + ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[proposal.status]}>
              {proposal.status}
            </Badge>
            {proposal.status === "draft" && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onSendToClient(proposal)}
                  disabled={generatingContent === proposal.id}
                >
                  {generatingContent === proposal.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {generatingContent === proposal.id ? "Generating..." : "Send to Client"}
                </Button>
                {userRole === "admin" && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-600 text-white"
                    onClick={() => onAccept(proposal)}
                    disabled={acceptingProposal === proposal.id}
                  >
                    {acceptingProposal === proposal.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Proceed & Create Project
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            {proposal.status === "sent" && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(proposalUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Client Link
                </Button>
                {userRole === "admin" && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onAccept(proposal)}
                    disabled={acceptingProposal === proposal.id}
                  >
                    {acceptingProposal === proposal.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Accept & Create Project
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-600 bg-green-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-xl font-bold text-slate-900">${proposal.total_fee?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Calendar className="w-8 h-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Timeline</p>
              <p className="font-semibold text-slate-900">{proposal.timeline || "TBD"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <FileText className="w-8 h-8 text-purple-600 bg-purple-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Valid Until</p>
              <p className="font-semibold text-slate-900">
                {proposal.valid_until ? format(new Date(proposal.valid_until), "MMM d, yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Project Description</h3>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-700 whitespace-pre-wrap">{proposal.description}</p>
          </div>
        </div>

        {proposal.scope_of_work && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Scope of Work</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{proposal.scope_of_work}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Structure</h3>
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{stage.name}</p>
                  <p className="text-sm text-slate-500">{stage.percentage}% of total project fee</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    ${((proposal.total_fee * stage.percentage) / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}