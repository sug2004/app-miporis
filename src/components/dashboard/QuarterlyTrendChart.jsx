import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Dot,
  ComposedChart,
} from "recharts";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  Sparkles,
  Target,
  Loader2,
} from "lucide-react";
import PropTypes from "prop-types";

export function QuarterlyTrendChart({ data = [], loading = false, compliancePercentage = 0 }) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              Quarterly Performance
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent
          className="relative z-10 flex items-center justify-center"
          style={{ height: "300px" }}
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">
              Loading trend data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length < 1) {
    return (
      <Card className="relative overflow-hidden glass border-0 shadow-[--shadow-card] h-full">
        <CardHeader className="relative z-10">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-chart-1/10">
              <LineChartIcon className="h-4 w-4 text-chart-1" />
            </div>
            Quarterly Performance
          </CardTitle>
        </CardHeader>

        <CardContent
          className="relative z-10 flex items-center justify-center"
          style={{ height: "300px" }}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Insufficient trend data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use compliance percentage as current value
  const currentValue = data[data.length - 1].value;
  const previousValue = data.length > 1 ? data[data.length - 2].value : currentValue;
  const growthRate = data.length > 1 
    ? Math.round(((currentValue - previousValue) / previousValue) * 100)
    : 0;

  // Format compliance percentage like in ProgressBar
  const displayValue = typeof compliancePercentage === "number" 
    ? (!Number.isInteger(compliancePercentage) ? compliancePercentage.toFixed(1) : compliancePercentage) + "%"
    : compliancePercentage + "%";

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isLatest = payload?.quarter === data[data.length - 1].quarter;
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isLatest ? 6 : 4}
        fill="hsl(var(--chart-1))"
        stroke="hsl(var(--card))"
        strokeWidth={isLatest ? 3 : 2}
        className={isLatest ? "animate-pulse-slow" : ""}
      />
    );
  };

  const CustomActiveDot = (props) => {
    const { cx, cy } = props;
    return (
      <g>
        <Dot
          cx={cx}
          cy={cy}
          r={8}
          fill="hsl(var(--chart-1))"
          fillOpacity={0.2}
          stroke="none"
        />
        <Dot
          cx={cx}
          cy={cy}
          r={4}
          fill="hsl(var(--chart-1))"
          stroke="hsl(var(--card))"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <Card className="group relative overflow-hidden glass border-0 shadow-[--shadow-card] hover:shadow-[--shadow-card-premium] transition-[transform,shadow] duration-500 hover:scale-[1.01] cursor-pointer">
      <div className="absolute inset-0 bg-gradient-metric opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
      </div>

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-chart-1/10 group-hover:scale-110 transition-transform duration-300">
              <LineChartIcon className="h-4 w-4 text-chart-1" />
            </div>
            Quarterly Performance
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30">
          <div>
            <p className="text-2xl font-bold text-foreground">{displayValue}</p>
            <p className="text-xs text-muted-foreground">Compliance Rate</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey="quarter"
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[
                Math.floor(Math.min(...data.map((item) => item.value)) * 0.8),
                Math.ceil(
                  Math.max(
                    ...data.map((item) => item.value),
                  ) * 1.1,
                ),
              ]}
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={<CustomActiveDot />}
              className="animate-slide-up"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs font-medium text-muted-foreground">
                  Growth Trend
                </span>
              </div>
              <p className="text-sm font-bold text-success">
                +
                {Math.round(
                  ((currentValue - data[0].value) / data[0].value) * 100,
                )}
                % YoY
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Consistency
                </span>
              </div>
              <p className="text-sm font-bold text-primary">
                {growthRate > 0
                  ? "Improving"
                  : "Needs Attention"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

QuarterlyTrendChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  compliancePercentage: PropTypes.number,
};
