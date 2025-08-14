import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notification as NotificationEntity } from "@/api/entities";
import { Bell, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationsPanel({ notifications, onClear, onClearAll }) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 shadow-lg mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl font-bold text-blue-900">Notifications</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear All
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white transition-colors">
              <div className="flex-1">
                <p className="font-semibold text-blue-900">{notification.title}</p>
                <p className="text-sm text-blue-800">{notification.message}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {notification.link && (
                  <Link to={notification.link}>
                    <Button size="sm" variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => onClear(notification.id)}>
                      View
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700" onClick={() => onClear(notification.id)}>
                  <Check className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}