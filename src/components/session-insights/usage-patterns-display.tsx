
import type { AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, TrendingUp, Clock } from "lucide-react";

interface UsagePatternsDisplayProps {
  data: AnalyzeUsagePatternsOutput;
}

export function UsagePatternsDisplay({ data }: UsagePatternsDisplayProps) {
  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl">AI Usage Pattern Analysis</CardTitle>
        </div>
        <CardDescription>
          Key insights into your system's usage behavior, powered by AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="p-4 rounded-lg bg-accent/20 border border-accent">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-accent-foreground">
            <Clock className="h-5 w-5" />
            Activity Windows
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Peak Hours</p>
              <Badge variant="default" className="text-sm py-1 px-3 bg-primary/10 text-primary border-primary/50 hover:bg-primary/20">
                {data.peakHours || "Not identified"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Quiet Hours</p>
              <Badge variant="secondary" className="text-sm py-1 px-3 bg-secondary/70 border-secondary hover:bg-secondary">
                {data.quietHours || "Not identified"}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/30">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
            <TrendingUp className="h-5 w-5" />
            Overall Trends
          </h3>
          <p className="text-foreground/90 text-sm leading-relaxed">
            {data.overallTrends || "No specific trends highlighted by the AI."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
