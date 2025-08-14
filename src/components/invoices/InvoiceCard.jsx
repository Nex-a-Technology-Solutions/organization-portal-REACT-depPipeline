import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, DollarSign } from "lucide-react";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200"
};

const stageLabels = {
  discovery: "Discovery & Requirements",
  design: "Design & Architecture", 
  development: "Development & Configuration",
  testing: "Testing & QA",
  deployment: "Deployment & Implementation",
  training: "Training & Handoff"
};

export default function InvoiceCard({ invoice, project, isSelected, onClick }) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? "ring-2 ring-slate-900 bg-slate-50 border-slate-300" 
          : "bg-white/80 backdrop-blur-sm border-slate-200 hover:border-slate-300"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
              {invoice.invoice_number}
            </h4>
            <p className="text-xs text-slate-500">{invoice.client_name}</p>
            <p className="text-xs text-slate-400">{stageLabels[invoice.stage]}</p>
          </div>
          <Badge className={`text-xs ${statusColors[invoice.status]}`}>
            {invoice.status}
          </Badge>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ${invoice.amount?.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Due {format(new Date(invoice.due_date), "MMM d")}
          </span>
        </div>

        {project && (
          <div className="text-xs text-slate-400 truncate">
            {project.title}
          </div>
        )}
      </CardContent>
    </Card>
  );
}