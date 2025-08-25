import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, AlertCircle, Clock, Info } from "lucide-react";

export default function NotificationsPanel({ notifications, onClear, onClearAll }) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  // Helper function to get the right icon for notification type
  const getNotificationIcon = (type, priority) => {
    const iconClass = "w-4 h-4";
    
    switch (priority) {
      case 'urgent':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'high':
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case 'medium':
        return <Clock className={`${iconClass} text-blue-500`} />;
      case 'low':
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  // Helper function to format notification date
  const formatNotificationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return "Just now";
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return "";
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200 shadow-lg mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl font-bold text-blue-900">
            Notifications ({notifications.length})
          </CardTitle>
        </div>
        {notifications.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearAll}
            className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
          >
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className="flex items-start justify-between p-3 bg-white/70 rounded-lg hover:bg-white transition-colors border border-blue-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {getNotificationIcon(notification.type, notification.priority)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900 text-sm leading-tight">
                      {notification.title || 'Notification'}
                    </p>
                    {notification.message && (
                      <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>
                {notification.created_date && (
                  <p className="text-xs text-blue-600 mt-2">
                    {formatNotificationDate(notification.created_date)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {notification.link && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-blue-700 border-blue-200 hover:bg-blue-100"
                    onClick={() => {
                      // Handle navigation here - you can implement routing logic
                      window.location.href = notification.link;
                      onClear(notification.id);
                    }}
                  >
                    View
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 h-8 w-8"
                  onClick={() => onClear(notification.id)}
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {notifications.length > 5 && (
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-600 text-center">
              Showing {Math.min(5, notifications.length)} of {notifications.length} notifications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}