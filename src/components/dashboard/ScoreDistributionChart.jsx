import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import PropTypes from "prop-types";

export function ScoreDistributionChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              Assessment Breakdown
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Loading distribution data...</p>
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
            <div className="p-1.5 rounded-lg bg-chart-1/10">
              <BarChart3 className="h-4 w-4 text-chart-1" />
            </div>
            Assessment Breakdown
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 flex items-center justify-center" style={{ height: "300px" }}>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No distribution data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalControls = data.reduce((sum, item) => sum + item.value, 0);
  
  // Get the highest percentage category for the insight message
  const highestCategory = [...data].sort((a, b) => b.percentage - a.percentage)[0];

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.01] cursor-pointer">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-metric opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Sparkle effect */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-chart-1/10 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="h-4 w-4 text-chart-1" />
            </div>
            Assessment Breakdown
          </CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
            {totalControls} controls
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis 
              dataKey="range" 
              fontSize={11}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              fontSize={11}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]}
              className="animate-slide-up"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Enhanced legend */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {data.map((item, index) => (
            <div key={item.range} className="text-center space-y-1 group/item hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full animate-pulse-slow" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
              <div className="font-bold text-sm text-foreground">{item.percentage}%</div>
              <div className="text-xs text-muted-foreground">{item.range}</div>
              <div className="text-xs font-medium" style={{ color: item.color }}>
                {item.value} controls
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>{highestCategory.percentage}% of controls {highestCategory.label.toLowerCase()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

ScoreDistributionChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool
};
