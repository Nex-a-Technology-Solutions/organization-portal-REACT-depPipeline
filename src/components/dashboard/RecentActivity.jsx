import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ArrowRight, Clock, DollarSign, Calendar, User } from "lucide-react";

const statusColors = {
  proposal: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800", 
  completed: "bg-emerald-100 text-emerald-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800"
};

// Helper function to safely access nested properties
const safeGet = (obj, path, defaultValue = '') => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

export default function RecentActivity({ projects, invoices, userRole }) {
  // Combine and sort recent items by date
  const recentItems = [];

  // Add projects to recent items
  if (projects && Array.isArray(projects)) {
    projects.forEach(project => {
      recentItems.push({
        type: 'project',
        id: project.id,
        title: safeGet(project, 'title') || safeGet(project, 'name') || 'Untitled Project',
        subtitle: safeGet(project, 'client_name') || safeGet(project, 'client.name') || safeGet(project, 'client.company_name') || 'No Client',
        status: safeGet(project, 'status') || 'active',
        amount: safeGet(project, 'total_fee') || safeGet(project, 'budget'),
        hours: safeGet(project, 'total_hours') || safeGet(project, 'hours_logged') || 0,
        date: safeGet(project, 'updated_date') || safeGet(project, 'created_date') || safeGet(project, 'start_date'),
        projectType: safeGet(project, 'project_type') || safeGet(project, 'type'),
        description: safeGet(project, 'description'),
      });
    });
  }

  // Add invoices to recent items (for non-client users)
  if (userRole !== "client" && invoices && Array.isArray(invoices)) {
    invoices.forEach(invoice => {
      recentItems.push({
        type: 'invoice',
        id: invoice.id,
        title: `Invoice #${safeGet(invoice, 'invoice_number') || safeGet(invoice, 'id')}`,
        subtitle: safeGet(invoice, 'client_name') || safeGet(invoice, 'client.name') || safeGet(invoice, 'client.company_name') || 'No Client',
        status: safeGet(invoice, 'status') || 'sent',
        amount: safeGet(invoice, 'amount') || safeGet(invoice, 'total'),
        date: safeGet(invoice, 'created_date') || safeGet(invoice, 'issue_date'),
        dueDate: safeGet(invoice, 'due_date'),
      });
    });
  }

  // Sort by date (most recent first)
  recentItems.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  // Take only the first 8 items
  const displayItems = recentItems.slice(0, 8);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
          <Link to={createPageUrl("Projects")}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 truncate">{item.title}</h4>
                    {item.type === 'invoice' && (
                      <Badge variant="outline" className="text-xs">
                        Invoice
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.subtitle}
                    </span>
                    
                    {item.projectType && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{item.projectType.replace('_', ' ')}</span>
                      </>
                    )}
                    
                    {item.hours > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.hours}h
                        </span>
                      </>
                    )}
                    
                    {item.date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.date)}
                        </span>
                      </>
                    )}
                    
                    {item.type === 'invoice' && item.dueDate && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">
                          Due {formatDate(item.dueDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  {userRole !== "client" && item.amount && (
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {typeof item.amount === 'number' 
                        ? formatCurrency(item.amount)
                        : item.amount.toLocaleString?.() || item.amount
                      }
                    </span>
                  )}
                  <Badge className={statusColors[item.status] || "bg-gray-100 text-gray-800"}>
                    {item.status ? item.status.replace('_', ' ') : 'Unknown'}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-lg font-medium mb-2">No recent activity</p>
              <p className="text-sm mb-4">
                {userRole === "client" 
                  ? "Your projects and updates will appear here"
                  : "Your projects and invoices will appear here"
                }
              </p>
              {userRole !== "client" && (
                <Link to={createPageUrl("Proposals")}>
                  <Button variant="outline" className="mt-2">
                    Create your first proposal
                  </Button>
                </Link>
              )}
              {userRole === "client" && (
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}