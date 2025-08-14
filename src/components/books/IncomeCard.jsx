import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  paid: "bg-green-100 text-green-800"
};

export default function IncomeCard({ invoice, detailed = false }) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-[#1E1E1D] mb-1">{invoice.invoice_number}</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{invoice.client_name}</span>
              <span>•</span>
              <span>{format(new Date(invoice.paid_date), "MMM d, yyyy")}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-green-600">
              +${invoice.amount?.toLocaleString()}
            </div>
            <Badge className={statusColors[invoice.status]}>
              Paid
            </Badge>
          </div>
        </div>

        {detailed && (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600">{invoice.stage_description}</p>
            
            <div className="text-xs text-gray-400">
              Invoice created {format(new Date(invoice.created_date), "MMM d, yyyy")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}