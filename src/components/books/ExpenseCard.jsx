import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const categoryColors = {
  office_supplies: "bg-blue-100 text-blue-800",
  software: "bg-purple-100 text-purple-800",
  hardware: "bg-gray-100 text-gray-800",
  travel: "bg-green-100 text-green-800",
  meals: "bg-orange-100 text-orange-800",
  utilities: "bg-yellow-100 text-yellow-800",
  rent: "bg-red-100 text-red-800",
  marketing: "bg-pink-100 text-pink-800",
  training: "bg-indigo-100 text-indigo-800",
  other: "bg-slate-100 text-slate-600"
};

const categoryLabels = {
  office_supplies: "Office Supplies",
  software: "Software",
  hardware: "Hardware", 
  travel: "Travel",
  meals: "Meals",
  utilities: "Utilities",
  rent: "Rent",
  marketing: "Marketing",
  training: "Training",
  other: "Other"
};

export default function ExpenseCard({ expense, detailed = false }) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-[#1E1E1D] mb-1">{expense.title}</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{expense.vendor}</span>
              <span>•</span>
              <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
              {!expense.tax_deductible && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-medium">Non-deductible</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-[#1E1E1D]">
              ${expense.amount?.toLocaleString()}
            </div>
            <Badge className={categoryColors[expense.category]}>
              {categoryLabels[expense.category]}
            </Badge>
          </div>
        </div>

        {detailed && (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            {expense.notes && (
              <p className="text-sm text-gray-600">{expense.notes}</p>
            )}
            
            <div className="flex justify-between items-center">
              {expense.receipt_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(expense.receipt_url, '_blank')}
                >
                  <Receipt className="w-3 h-3 mr-2" />
                  View Receipt
                </Button>
              )}
              
              <div className="text-xs text-gray-400">
                Added {format(new Date(expense.created_date), "MMM d, yyyy")}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}