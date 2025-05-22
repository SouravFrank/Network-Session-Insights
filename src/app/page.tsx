
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, List, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import type { SessionData, RawDayAggregation, RawWeekAggregation, RawMonthAggregation } from "@/lib/session-utils/types";
import { SessionDataParsingError } from "@/lib/session-utils/types"; 
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
import { aggregateSessionsByDay, aggregateSessionsByWeek, aggregateSessionsByMonth } from "@/lib/session-utils/aggregations";
import { formatDate, formatDurationFromSeconds, formatDataSizeForDisplay } from "@/lib/session-utils/formatters";


type ActiveView = 'session' | 'daily' | 'weekly' | 'monthly' | null;

// Helper function to parse the raw JSON text data into SessionData objects
function parseRawTextToSessions(rawData: string): SessionData[] {
  if (!rawData || !rawData.trim()) return [];
  
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawData);
  } catch (error: any) {
    throw new SessionDataParsingError(`Invalid JSON format: ${error.message}. Please ensure your input is a valid JSON array.`);
  }

  if (!Array.isArray(parsedJson)) {
    throw new SessionDataParsingError('Input data must be a JSON array. e.g., [{"loginTime": "...", ...}]');
  }

  const sessions: SessionData[] = [];
  for (let i = 0; i < parsedJson.length; i++) {
    const item = parsedJson[i];
    if (typeof item !== 'object' || item === null) {
      throw new SessionDataParsingError(`Item at index ${i} is not a valid object.`);
    }

    const { loginTime, sessionTime, download, upload } = item;

    if (typeof loginTime !== 'string') {
      throw new SessionDataParsingError(`Item at index ${i}: "loginTime" must be a string (e.g., "DD-MM-YYYY HH:MM:SS").`);
    }
    if (typeof sessionTime !== 'string') {
      throw new SessionDataParsingError(`Item at index ${i}: "sessionTime" must be a string (e.g., "HH:MM:SS").`);
    }
    if (typeof download !== 'number' || isNaN(download) || download < 0) {
      throw new SessionDataParsingError(`Item at index ${i}: "download" must be a non-negative number. Got: "${download}".`);
    }
    if (typeof upload !== 'number' || isNaN(upload) || upload < 0) {
      throw new SessionDataParsingError(`Item at index ${i}: "upload" must be a non-negative number. Got: "${upload}".`);
    }

    // Validate date/time string formats using existing parsers
    try {
      parseLoginTime(loginTime);
    } catch (e: any) {
      throw new SessionDataParsingError(`Item at index ${i}: Invalid "loginTime" format for "${loginTime}". Expected "DD-MM-YYYY HH:MM:SS". Underlying error: ${e.message}`);
    }
    try {
      parseSessionDurationToSeconds(sessionTime);
    } catch (e: any) {
      throw new SessionDataParsingError(`Item at index ${i}: Invalid "sessionTime" format for "${sessionTime}". Expected "HH:MM:SS". Underlying error: ${e.message}`);
    }
    
    sessions.push({
      loginTime,
      sessionTime,
      download,
      upload,
    });
  }
  return sessions;
}


export default function SessionInsightsPage() {
  const [rawSessionData, setRawSessionData] = React.useState<string | null>(null);
  const [parsedSessions, setParsedSessions] = React.useState<SessionData[] | null>(null);
  
  const [dailyAggregatedData, setDailyAggregatedData] = React.useState<RawDayAggregation[] | null>(null);
  const [weeklyAggregatedData, setWeeklyAggregatedData] = React.useState<RawWeekAggregation[] | null>(null);
  const [monthlyAggregatedData, setMonthlyAggregatedData] = React.useState<RawMonthAggregation[] | null>(null);
  
  const [activeView, setActiveView] = React.useState<ActiveView>(null);
  const [isLoadingView, setIsLoadingView] = React.useState(false);

  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeUsagePatternsOutput | null>(null);
  const [maintenanceSuggestion, setMaintenanceSuggestion] = React.useState<SuggestMaintenanceScheduleOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const { toast } = useToast();

  const handleDataLoadSubmit = (sessionDataText: string) => {
    setRawSessionData(sessionDataText);
    // Clear all derived data
    setParsedSessions(null);
    setDailyAggregatedData(null);
    setWeeklyAggregatedData(null);
    setMonthlyAggregatedData(null);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);
    setActiveView(null); // Reset view
     toast({
        title: "Data Loaded",
        description: "Session data is ready. Select a view (Session, Daily, etc.) to process and display.",
      });
  };

  const processAndSetView = async (viewType: ActiveView) => {
    if (!rawSessionData) {
      toast({ variant: "destructive", title: "No Data", description: "Please load session data first." });
      return;
    }
    
    setIsLoadingView(true);
    setActiveView(viewType);

    try {
      let currentParsedSessions = parsedSessions;
      // Always try to parse if view changes or no parsed sessions yet.
      // This ensures if raw data is edited and a view is re-clicked, it re-parses.
      if (!currentParsedSessions || viewType) { 
        currentParsedSessions = parseRawTextToSessions(rawSessionData);
        setParsedSessions(currentParsedSessions);
      }


      if (viewType === 'session') {
        // Data is already parsed and set in parsedSessions state
      } else if (viewType === 'daily') {
        const dailyData = aggregateSessionsByDay(currentParsedSessions);
        setDailyAggregatedData(dailyData);
      } else if (viewType === 'weekly') {
        const weeklyData = aggregateSessionsByWeek(currentParsedSessions);
        setWeeklyAggregatedData(weeklyData);
      } else if (viewType === 'monthly') {
        const monthlyData = aggregateSessionsByMonth(currentParsedSessions);
        setMonthlyAggregatedData(monthlyData);
      }
    } catch (error: any) {
      console.error(`Error processing data for ${viewType} view:`, error);
      toast({
        variant: "destructive",
        title: `Error Processing Data for ${viewType || 'selected'} view`,
        description: error instanceof SessionDataParsingError ? error.message : "An unexpected error occurred.",
      });
      setActiveView(null); // Reset view on error
      setParsedSessions(null); // Clear parsed data if parsing failed
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!rawSessionData) {
      toast({ variant: "destructive", title: "No Data", description: "Please load session data first." });
      return;
    }
     // Ensure data is parsed before sending to AI, as AI flows might expect structured data if modified in future
    // Or, keep AI analysis based on raw string if flows are designed for that
    // For now, sticking to rawSessionData string as per current AI flow design
    // If AI needs parsed data, we'd parse here:
    // try {
    //   if (!parsedSessions) {
    //     const sessions = parseRawTextToSessions(rawSessionData);
    //     setParsedSessions(sessions); // Optionally set state if needed elsewhere
    //   }
    // } catch (error: any) {
    //   toast({ variant: "destructive", title: "Data Parsing Failed for AI", description: error.message });
    //   return;
    // }


    setIsLoadingAi(true);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);

    try {
      // The AI flow analyzeUsagePatterns expects a string of sessionData.
      // If it were to expect structured data, we'd pass parsedSessions (after ensuring it's parsed).
      const usagePatterns = await analyzeUsagePatterns({ sessionData: rawSessionData });
      setAnalysisResult(usagePatterns);

      const currentTime = new Date().toISOString();
      const scheduleSuggestion = await suggestMaintenanceSchedule({
        usagePatterns: `Peak Hours: ${usagePatterns.peakHours}, Quiet Hours: ${usagePatterns.quietHours}, Trends: ${usagePatterns.overallTrends}`,
        currentTime,
      });
      setMaintenanceSuggestion(scheduleSuggestion);

      toast({
        title: "AI Analysis Complete",
        description: "Session data analyzed and maintenance schedule suggested.",
      });

    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during AI analysis.",
      });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const [clientCurrentTime, setClientCurrentTime] = React.useState<string | null>(null);
  React.useEffect(() => {
    setClientCurrentTime(new Date().toLocaleTimeString());
  }, []);

  const renderViewContent = () => {
    if (isLoadingView) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[200px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Loading view data...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'session':
        return parsedSessions && parsedSessions.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>Raw Sessions (from JSON input)</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(parsedSessions, null, 2)}</pre></CardContent>
          </Card>
        ) : <p className="text-muted-foreground">No session data to display or parsing failed. Please load valid JSON data.</p>;
      case 'daily':
        return dailyAggregatedData && dailyAggregatedData.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>Daily Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(dailyAggregatedData.map(d => ({...d, date: formatDate(d.date), totalDurationFormatted: formatDurationFromSeconds(d.totalDurationSeconds, true), totalDownloadedMB: d.totalDownloadedMB.toFixed(2), totalUploadedMB: d.totalUploadedMB.toFixed(2) })), null, 2)}</pre></CardContent>
          </Card>
        ) : <p className="text-muted-foreground">No daily data to display. Process the data first.</p>;
      case 'weekly':
        return weeklyAggregatedData && weeklyAggregatedData.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>Weekly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(weeklyAggregatedData.map(w => ({...w, startDate: formatDate(w.startDate), endDate: formatDate(w.endDate), totalDurationFormatted: formatDurationFromSeconds(w.totalDurationSeconds, true), totalDownloadedMB: w.totalDownloadedMB.toFixed(2), totalUploadedMB: w.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <p className="text-muted-foreground">No weekly data to display. Process the data first.</p>;
      case 'monthly':
        return monthlyAggregatedData && monthlyAggregatedData.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>Monthly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(monthlyAggregatedData.map(m => ({...m, startDate: formatDate(m.startDate), endDate: formatDate(m.endDate), totalDurationFormatted: formatDurationFromSeconds(m.totalDurationSeconds, true), totalDownloadedMB: m.totalDownloadedMB.toFixed(2), totalUploadedMB: m.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <p className="text-muted-foreground">No monthly data to display. Process the data first.</p>;
      default:
        return rawSessionData ? <p className="text-muted-foreground text-center py-4">Select a view (Session, Daily, Weekly, Monthly) to see processed data.</p> : <p className="text-muted-foreground text-center py-4">Please load session data using the form above.</p>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <DataInputForm onSubmit={handleDataLoadSubmit} isLoading={isLoadingView || isLoadingAi} />
            
            {rawSessionData && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="grid grid-cols-2 gap-2 mb-4">
                      <Button onClick={() => processAndSetView('session')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'session' ? 'default' : 'outline'}><List className="mr-2 h-4 w-4" />Sessions</Button>
                      <Button onClick={() => processAndSetView('daily')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'daily' ? 'default' : 'outline'}><CalendarDays className="mr-2 h-4 w-4" />Daily</Button>
                      <Button onClick={() => processAndSetView('weekly')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'weekly' ? 'default' : 'outline'}><CalendarRange className="mr-2 h-4 w-4" />Weekly</Button>
                      <Button onClick={() => processAndSetView('monthly')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'monthly' ? 'default' : 'outline'}><Calendar className="mr-2 h-4 w-4" />Monthly</Button>
                    </div>
                  <Button 
                      onClick={handleAiAnalysis} 
                      disabled={isLoadingAi || !rawSessionData}
                      className="w-full"
                    >
                    {isLoadingAi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="lg:col-span-2 space-y-8">
            {renderViewContent()}
            
            {isLoadingAi && !analysisResult && !maintenanceSuggestion && (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg text-muted-foreground">AI is analyzing your data... Please wait.</p>
              </div>
            )}

            {!isLoadingAi && analysisResult && (
              <UsagePatternsDisplay data={analysisResult} />
            )}
            {!isLoadingAi && maintenanceSuggestion && (
              <MaintenanceSuggestionDisplay data={maintenanceSuggestion} />
            )}
            <AnomalyAlertDisplay /> {/* This is currently static */}
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

