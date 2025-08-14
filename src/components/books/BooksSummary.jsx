import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";

export default function BooksSummary({ expenses, income, dateFilter }) {
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalIncome = income.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const netIncome = totalIncome - totalExpenses;
  const deductibleExpenses = expenses
    .filter(expense => expense.tax_deductible)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "this_month": return "This Month";
      case "this_quarter": return "This Quarter"; 
      case "this_year": return "This Year";
      default: return "All Time";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${totalExpenses.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#1E1E1D]" />
            Net Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            Tax Deductible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ${deductibleExpenses.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Deductible expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}