'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export default function NotificationsCenter() {
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Credit Score Updated',
      message: 'Your Composite Score has been recalculated and improved by 15 points',
      time: '2 hours ago',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 2,
      type: 'warning',
      title: 'Document Verification Pending',
      message: 'Please upload your latest electricity bill to complete verification',
      time: '1 day ago',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature Available',
      message: 'AI Financial Advisor is now available in your dashboard',
      time: '3 days ago',
      icon: <Info className="h-4 w-4" />
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                  {notification.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">Mark as Read</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}