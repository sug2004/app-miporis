import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { FileText, ArrowRight, Sparkles, Target, Loader2 } from "lucide-react";
import PropTypes from "prop-types";

export function EvidenceUpliftTable({ data = [], loading = false }) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            Evidence Uplift Recommendations
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Loading recommendations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            Evidence Uplift Recommendations
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No recommendations available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium": 
        return "bg-warning/10 text-warning border-warning/20";
      case "Low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.005] cursor-pointer">
      <div className="absolute inset-0 bg-gradient-metric opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            Evidence Uplift Recommendations
          </CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
            {data.length} suggestions
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="w-20 text-xs font-medium text-muted-foreground">ID</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Recommendation</TableHead>
              <TableHead className="w-20 text-xs font-medium text-muted-foreground">Priority</TableHead>
              <TableHead className="w-16 text-xs font-medium text-muted-foreground">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow 
                key={item.controlId} 
                className="border-border/50 hover:bg-background/50 transition-colors group/row animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TableCell className="font-mono text-xs">
                  <Badge variant="outline" className="font-mono text-primary border-primary/20">
                    {item.controlId}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground flex-1">{item.suggestion}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-xs ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{item.impact}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

EvidenceUpliftTable.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool
};
  