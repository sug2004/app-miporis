import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, FileCheck, AlertCircle, Sparkles } from "lucide-react";
import PropTypes from "prop-types";

export function MetricsOverview({ metrics }) {
  // Use default metrics if none provided
  const defaultMetrics = [
    {
      title: "Total Controls",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: FileCheck,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      status: "Excellent",
      subtitle: "Controls managed"
    },
    {
      title: "Active Risks",
      value: "0",
      change: "-0%",
      trend: "down",
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      status: "Improving",
      subtitle: "Risks identified"
    },
    {
      title: "Evidence Items",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      status: "Growing",
      subtitle: "Evidence collected"
    },
    {
      title: "Team Members",
      value: "1",
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      status: "Active",
      subtitle: "Active users"
    },
  ];

  const metricsToRender = metrics || defaultMetrics;

  // Map string icon names to actual components
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "FileCheck": return FileCheck;
      case "AlertCircle": return AlertCircle;
      case "TrendingUp": return TrendingUp;
      case "Users": return Users;
      default: return FileCheck;
    }
  };

  const handleCardClick = (metric) => {
    if (metric.onClick) {
      metric.onClick();
    } else if (metric.path) {
      window.location.href = metric.path;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
      {metricsToRender.map((metric, index) => {
        const IconComponent = typeof metric.icon === 'string' ? getIconComponent(metric.icon) : metric.icon;
        
        return (
          <Card 
            key={metric.title} 
            className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.02] cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleCardClick(metric)}
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 ${metric.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Sparkle effect */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
            </div>
            
            <CardContent className="relative p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-0 ${
                        metric.trend === "up" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                      }`}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                </div>
                
                <div className={`relative p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-6 w-6 ${metric.color} group-hover:animate-float`} />
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metric.trend === "up" ? "text-success" : "text-destructive"
                  }`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground">this month</span>
                </div>
                
                {/* Mini progress bar */}
                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${
                      metric.trend === "up" ? "bg-success" : "bg-destructive"
                    } group-hover:animate-shimmer`}
                    style={{ width: `${Math.abs(parseInt(metric.change))}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

MetricsOverview.propTypes = {
  metrics: PropTypes.array
};
