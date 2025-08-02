import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Activity, Clock, CheckCircle2, Sparkles, Zap, Loader2 } from "lucide-react";
import PropTypes from "prop-types";

export function RecentActivity({ activities = [], loading = false }) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Loading activity data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No recent activities available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "pending":
        return "text-info";
      default:
        return "text-muted-foreground";
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "pending":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getIconComponent = (activity) => {
    if (activity.icon) {
      if (typeof activity.icon === 'string') {
        switch (activity.icon) {
          case "CheckCircle2": return CheckCircle2;
          case "Clock": return Clock;
          case "Activity": return Activity;
          default: return Activity;
        }
      }
      return activity.icon;
    }
    
    switch (activity.type) {
      case "evidence_uploaded":
        return CheckCircle2;
      case "control_review":
        return Clock;
      case "risk_identified":
        return Activity;
      default:
        return Activity;
    }
  };

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.01] cursor-pointer">
      <div className="absolute inset-0 bg-gradient-metric opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      <CardHeader className="relative z-10">
        <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform duration-300">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-3">
        {activities.map((activity, index) => {
          const IconComponent = getIconComponent(activity);
          
          return (
            <div 
              key={index} 
              className="group/item flex items-start space-x-3 p-3 rounded-lg bg-background/20 hover:bg-background/40 transition-all duration-300 hover:scale-[1.01] cursor-pointer border border-border/30 animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className={`p-2 rounded-lg bg-background/60 ${getStatusColor(activity.status)} group-hover/item:scale-110 transition-transform duration-300`}>
                <IconComponent className="h-4 w-4 group-hover/item:animate-float" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover/item:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getBadgeStyle(activity.status)}`}
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

RecentActivity.propTypes = {
  activities: PropTypes.array,
  loading: PropTypes.bool
};
