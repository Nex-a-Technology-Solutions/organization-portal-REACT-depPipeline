
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200"
};

const typeColors = {
  integrations: "bg-purple-100 text-purple-800",
  automations: "bg-blue-100 text-blue-800",
  "automations+integrations": "bg-indigo-100 text-indigo-800",
  apps: "bg-green-100 text-green-800",
  websites: "bg-orange-100 text-orange-800"
};

export default function ProposalCard({ proposal, isSelected, onClick }) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 rounded-lg border-l-4 ${
        isSelected 
          ? "border-amber-500 bg-white shadow-lg" 
          : "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
              {proposal.title}
            </h4>
            <p className="text-xs text-slate-500">{proposal.client_name}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={`text-xs ${statusColors[proposal.status]}`}>
              {proposal.status}
            </Badge>
            <Badge variant="outline" className={`text-xs ${typeColors[proposal.project_type]}`}>
              {proposal.project_type?.replace('+', ' + ')}
            </Badge>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            ${proposal.total_fee?.toLocaleString()}
          </span>
          <span>
            {format(new Date(proposal.created_date), "MMM d, yyyy")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
