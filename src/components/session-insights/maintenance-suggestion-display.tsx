
import type { SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CalendarClock, MessageSquareText, ShieldCheck } from "lucide-react";

interface MaintenanceSuggestionDisplayProps {
  data: SuggestMaintenanceScheduleOutput;
}

export function MaintenanceSuggestionDisplay({ data }: MaintenanceSuggestionDisplayProps) {
  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <CardTitle className="text-2xl">AI Maintenance Scheduling</CardTitle>
        </div>
        <CardDescription>
          Optimal times for system maintenance, minimizing disruption.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="p-4 rounded-lg bg-accent/20 border border-accent">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-accent-foreground">
            <CalendarClock className="h-5 w-5" />
            Suggested Maintenance Time
          </h3>
          <p className="text-accent-foreground/90 text-lg font-medium bg-accent/30 p-3 rounded-md">
            {data.suggestedMaintenanceTime || "No specific time suggested."}
          </p>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/30">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
            <MessageSquareText className="h-5 w-5" />
            Reasoning from AI
          </h3>
          <p className="text-foreground/90 text-sm leading-relaxed">
            {data.reasoning || "No detailed reasoning provided by the AI."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
