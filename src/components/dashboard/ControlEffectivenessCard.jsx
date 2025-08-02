import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import PropTypes from "prop-types";

export function ControlEffectivenessCard({
  score,
  status,
  loading = false,
  compact = false,
}) {
  if (loading || score === undefined || score === null) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full flex items-center justify-center">
        <CardHeader className="relative z-10 pb-3 text-center">
          <CardTitle className="text-base font-medium text-foreground flex items-center justify-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
             Compliance Rate
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 text-center">
          <div className="py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">
              {loading ? "Loading data..." : "No data available"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format score to show decimal places like in ProgressBar
  const displayScore = typeof score === "number" 
    ? (!Number.isInteger(score) ? score.toFixed(1) : score)
    : score;

  const getStatusText = (status) => {
    switch (status) {
      case "strong":
        return "Excellent Performance";
      case "moderate":
        return "Room for Improvement";
      case "weak":
        return "Needs Immediate Attention";
      default:
        return "Performance Review";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "strong":
        return "text-success";
      case "moderate":
        return "text-warning";
      case "weak":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "strong":
        return "bg-success/10";
      case "moderate":
        return "bg-warning/10";
      case "weak":
        return "bg-destructive/10";
      default:
        return "bg-muted/10";
    }
  };

  const getIcon = (status) => {
    switch (status) {
      case "strong":
        return CheckCircle;
      case "moderate":
      case "weak":
        return AlertTriangle;
      default:
        return Target;
    }
  };

  const StatusIcon = getIcon(status);

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] transition-[transform,shadow] duration-300 hover:scale-[1.005] hover:shadow-[--shadow-card-premium] cursor-pointer h-full flex items-center justify-center">
      {/* Animated gradient overlay */}
      <div
        className={`absolute inset-0 ${getStatusBg(
          status
        )} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Sparkle effect */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      {/* Animated background ring */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className={`${getStatusColor(status)} animate-pulse-slow`}
          />
        </svg>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center justify-center px-6 py-8 w-full max-w-md">
        {/* Header */}
        <CardHeader className="pb-3 w-full text-center">
          <CardTitle className="text-base font-medium text-foreground flex items-center justify-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${getStatusBg(
                status
              )} group-hover:scale-110 transition-transform duration-300`}
            >
              <Target className={`h-4 w-4 ${getStatusColor(status)}`} />
            </div>
            Compliance Rate
          </CardTitle>
        </CardHeader>

        {/* Score */}
        <CardContent className="space-y-6 w-full">
          <div className="flex flex-col items-center justify-center">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 text-6xl font-black ${getStatusColor(
                  status
                )} opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300`}
              >
                {displayScore}%
              </div>
              <div
                className={`relative text-6xl font-black ${getStatusColor(
                  status
                )} group-hover:scale-105 transition-transform duration-300 animate-slide-up`}
              >
                {displayScore}%
              </div>
            </div>

            <Badge
              variant="secondary"
              className={`mt-3 text-xs px-3 py-1 ${
                status === "strong"
                  ? "bg-success/10 text-success border-success/20"
                  : status === "moderate"
                  ? "bg-warning/10 text-warning border-warning/20"
                  : status === "weak"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-muted/10 text-muted-foreground border-muted/20"
              }`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {getStatusText(status)}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-3 text-left w-full">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Progress to target</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{score > 80 ? 5 : score > 60 ? 8 : 15}% this quarter
              </span>
            </div>
            <Progress value={score} className="h-2 bg-muted/50" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-foreground">Target: 85%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Mini insight */}
          <div className="pt-2 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              {score >= 85
                ? "🎉 Exceeding compliance standards"
                : score >= 70
                ? "📈 On track to meet targets"
                : "⚡ Action required for improvement"}
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

ControlEffectivenessCard.propTypes = {
  score: PropTypes.number,
  status: PropTypes.string,
  loading: PropTypes.bool,
  compact: PropTypes.bool,
};
