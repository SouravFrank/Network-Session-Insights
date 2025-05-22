"use client";

import * as React from "react";
import { AppHeader } from "@/components/session-insights/app-header";
import { DataInputForm } from "@/components/session-insights/data-input-form";
import { UsagePatternsDisplay } from "@/components/session-insights/usage-patterns-display";
import { MaintenanceSuggestionDisplay } from "@/components/session-insights/maintenance-suggestion-display";
import { AnomalyAlertDisplay } from "@/components/session-insights/anomaly-alert-display";
import { analyzeUsagePatterns, type AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { suggestMaintenanceSchedule, type SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SessionInsightsPage() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeUsagePatternsOutput | null>(null);
  const [maintenanceSuggestion, setMaintenanceSuggestion] = React.useState<SuggestMaintenanceScheduleOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleDataSubmit = async (sessionData: string) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);

    try {
      // Step 1: Analyze Usage Patterns
      const usagePatterns = await analyzeUsagePatterns({ sessionData });
      setAnalysisResult(usagePatterns);

      // Step 2: Suggest Maintenance Schedule
      // Ensure currentTime is generated on the server or in a way that avoids hydration mismatch if critical.
      // For this AI flow, sending a string representation from client is fine.
      const currentTime = new Date().toISOString();
      const scheduleSuggestion = await suggestMaintenanceSchedule({
        usagePatterns: `Peak Hours: ${usagePatterns.peakHours}, Quiet Hours: ${usagePatterns.quietHours}, Trends: ${usagePatterns.overallTrends}`,
        currentTime,
      });
      setMaintenanceSuggestion(scheduleSuggestion);

      toast({
        title: "Analysis Complete",
        description: "Session data analyzed and maintenance schedule suggested.",
      });

    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during AI analysis.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Current time for suggestion - ensure this doesn't cause hydration issues if rendered server-side initially
  // Since it's only used after client-side interaction (form submit), it should be fine.
  const [clientCurrentTime, setClientCurrentTime] = React.useState<string | null>(null);
  React.useEffect(() => {
    setClientCurrentTime(new Date().toLocaleTimeString());
  }, []);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DataInputForm onSubmit={handleDataSubmit} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2 space-y-8">
            {isLoading && !analysisResult && !maintenanceSuggestion && (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg text-muted-foreground">Analyzing your data... Please wait.</p>
              </div>
            )}
            {analysisResult && (
              <UsagePatternsDisplay data={analysisResult} />
            )}
            {maintenanceSuggestion && (
              <MaintenanceSuggestionDisplay data={maintenanceSuggestion} />
            )}
            <AnomalyAlertDisplay />
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Session Insights. All rights reserved.
        {clientCurrentTime ? <p className="text-xs">Client Time: {clientCurrentTime}</p> : <p className="text-xs">Loading client time...</p>}
      </footer>
    </div>
  );
}
