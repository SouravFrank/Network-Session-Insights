import type { AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Clock, TrendingUp } from "lucide-react";

interface UsagePatternsDisplayProps {
  data: AnalyzeUsagePatternsOutput;
}

export function UsagePatternsDisplay({ data }: UsagePatternsDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <CardTitle>Usage Pattern Analysis</CardTitle>
        </div>
        <CardDescription>
          AI-driven insights into your system's usage behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-accent-foreground" />
            Peak Hours
          </h3>
          <p className="text-muted-foreground">{data.peakHours}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-accent-foreground" />
            Quiet Hours
          </h3>
          <p className="text-muted-foreground">{data.quietHours}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
            Overall Trends
          </h3>
          <p className="text-muted-foreground">{data.overallTrends}</p>
        </div>
      </CardContent>
    </Card>
  );
}
