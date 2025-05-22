import type { SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CalendarClock, MessageSquareText } from "lucide-react";

interface MaintenanceSuggestionDisplayProps {
  data: SuggestMaintenanceScheduleOutput;
}

export function MaintenanceSuggestionDisplay({ data }: MaintenanceSuggestionDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <CardTitle>Maintenance Scheduling Suggestion</CardTitle>
        </div>
        <CardDescription>
          Optimal times for system maintenance based on usage patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <CalendarClock className="h-5 w-5 text-accent-foreground" />
            Suggested Time
          </h3>
          <p className="text-muted-foreground">{data.suggestedMaintenanceTime}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <MessageSquareText className="h-5 w-5 text-accent-foreground" />
            Reasoning
          </h3>
          <p className="text-muted-foreground">{data.reasoning}</p>
        </div>
      </CardContent>
    </Card>
  );
}
