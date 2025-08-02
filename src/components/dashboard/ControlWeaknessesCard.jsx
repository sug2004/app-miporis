import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { AlertTriangle, Sparkles, FileX, Shield } from "lucide-react";
import PropTypes from "prop-types";

const defaultWeaknesses = [
  {
    category: "Financial Reporting",
    count: 4,
    severity: "high",
    percentage: 57,
    trend: "stable",
    priority: "Critical"
  },
  {
    category: "IT Security",
    count: 2,
    severity: "medium",
    percentage: 29,
    trend: "improving",
    priority: "Important"
  },
  {
    category: "Operations",
    count: 1,
    severity: "low",
    percentage: 14,
    trend: "improving",
    priority: "Monitor"
  },
];

export function ControlWeaknessesCard({ weaknesses = defaultWeaknesses }) {
  const weaknessesToRender = (weaknesses.length > 0 ? weaknesses : defaultWeaknesses)
  .sort((a, b) => (100 - b.percentage) - (100 - a.percentage));

  const totalWeaknesses = weaknessesToRender.reduce((sum, item) => sum + item.count, 0);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case "high":
        return "bg-destructive/10";
      case "medium":
        return "bg-warning/10";
      case "low":
        return "bg-success/10";
      default:
        return "bg-muted/10";
    }
  };

  const getBadgeStyle = (severity) => {
    switch (severity) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  // Find the highest priority weakness for the summary insight
  const highestPriorityWeakness = [...weaknessesToRender].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  })[0];

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.02] cursor-pointer">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Sparkle effect */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            Control Weaknesses
          </CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-destructive/10 text-destructive border-destructive/20">
            {totalWeaknesses} issues
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {weaknessesToRender.map((weakness, index) => (
          <div
            key={weakness.category}
            className="group/item p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-all duration-300 hover:scale-[1.01] cursor-pointer border border-border/50"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getSeverityBg(weakness.severity)} ${getSeverityColor(weakness.severity)} animate-pulse-slow`} />
                <span className="text-sm font-medium text-foreground">{weakness.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 ${getBadgeStyle(weakness.severity)}`}
                >
                  {weakness.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 font-bold ${getSeverityColor(weakness.severity)}`}
                >
                  {weakness.count}
                </Badge>
              </div>
            </div>

            {/* Progress bar showing percentage of total issues */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Impact distribution</span>
                <span>{100 - weakness.percentage}%</span>
              </div>
              <Progress
                value={100 - weakness.percentage}
                className="h-1.5"
              />
            </div>

          </div>
        ))}

      </CardContent>
    </Card>
  );
}

ControlWeaknessesCard.propTypes = {
  weaknesses: PropTypes.array
};
