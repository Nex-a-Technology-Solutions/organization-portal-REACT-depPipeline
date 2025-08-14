import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, gradient, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
        <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full`} />
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {title}
              </p>
              <div className="text-4xl font-bold text-[#1E1E1D]">
                {value}
              </div>
              {description && (
                <p className="text-sm text-gray-400 font-medium pt-1">
                  {description}
                </p>
              )}
            </div>
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ml-4`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}