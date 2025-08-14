
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Send, CheckCircle2, DollarSign, Calendar, FileText, Mail } from "lucide-react";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800"
};

const stageLabels = {
  discovery: "Discovery & Requirements",
  design: "Design & Architecture", 
  development: "Development & Configuration",
  testing: "Testing & QA",
  deployment: "Deployment & Implementation",
  training: "Training & Handoff"
};

export default function InvoiceViewer({ invoice, project, onSendInvoice, onMarkAsPaid, sendingInvoice }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Invoice {invoice.invoice_number}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>{invoice.client_name}</span>
              <span>•</span>
              <span>{stageLabels[invoice.stage]}</span>
              <span>•</span>
              <span>{invoice.percentage}% of project</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[invoice.status]}>
              {invoice.status}
            </Badge>
            {invoice.status === "draft" && (
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onSendInvoice(invoice)}
                disabled={sendingInvoice === invoice.id}
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingInvoice === invoice.id ? "Sending..." : "Send Invoice"}
              </Button>
            )}
            {invoice.status === "sent" && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onMarkAsPaid(invoice)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-600 bg-green-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Amount</p>
              <p className="text-xl font-bold text-slate-900">${invoice.amount?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Calendar className="w-8 h-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Due Date</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(invoice.due_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <FileText className="w-8 h-8 text-purple-600 bg-purple-100 rounded-lg p-2" />
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(invoice.created_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {project && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Project Details</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">{project.title}</span>
                <span className="text-slate-600 capitalize">{project.project_type?.replace('+', ' + ')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Project Value</span>
                <span className="font-medium text-slate-700">${project.total_fee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">This Invoice ({invoice.percentage}%)</span>
                <span className="font-medium text-slate-700">${invoice.amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {invoice.project_description && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Project Description</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-600 whitespace-pre-wrap">
                {invoice.project_description}
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Stage Description</h3>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-700 whitespace-pre-wrap">
              {invoice.stage_description || `Work completed for the ${stageLabels[invoice.stage]} phase of the project.`}
            </p>
          </div>
        </div>

        {(invoice.sent_date || invoice.paid_date) && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Payment History</h3>
            <div className="space-y-2">
              {invoice.sent_date && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">Invoice Sent</span>
                  <span className="text-blue-600">{format(new Date(invoice.sent_date), "MMM d, yyyy")}</span>
                </div>
              )}
              {invoice.paid_date && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Payment Received</span>
                  <span className="text-green-600">{format(new Date(invoice.paid_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
