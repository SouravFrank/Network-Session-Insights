
"use client";

import * as React from "react";
import { AppHeader } from "@/components/session-insights/app-header";
import { DataInputForm } from "@/components/session-insights/data-input-form";
import { UsagePatternsDisplay } from "@/components/session-insights/usage-patterns-display";
import { MaintenanceSuggestionDisplay } from "@/components/session-insights/maintenance-suggestion-display";
import { AnomalyAlertDisplay } from "@/components/session-insights/anomaly-alert-display";
import { SessionDataTable } from "@/components/session-insights/session-data-table";
import { SessionTimelineChart } from "@/components/session-insights/charts/SessionTimelineChart";
import { analyzeUsagePatterns, type AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { suggestMaintenanceSchedule, type SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Sparkles, List, CalendarDays, CalendarRange, Calendar as CalendarIconLucide, BarChart2, TableIcon, Info, FilterX } from "lucide-react"; // Renamed Calendar from lucide
import type { SessionData, RawDayAggregation, RawWeekAggregation, RawMonthAggregation } from "@/lib/session-utils/types";
import { SessionDataParsingError } from "@/lib/session-utils/types";
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
import { aggregateSessionsByDay, aggregateSessionsByWeek, aggregateSessionsByMonth } from "@/lib/session-utils/aggregations";
import { formatDate, formatDurationFromSeconds } from "@/lib/session-utils/formatters";
import { startOfDay, endOfDay } from 'date-fns';


type ActiveView = 'session' | 'daily' | 'weekly' | 'monthly' | null;
type DisplayFormat = 'table' | 'chart';

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
  const [parsedSessions, setParsedSessions] = React.useState<SessionData[] | null>(null); // Stores all parsed sessions
  
  // State for data filtered by date range and then processed for the current view
  const [filteredSessionViewData, setFilteredSessionViewData] = React.useState<SessionData[] | null>(null);
  const [dailyAggregatedData, setDailyAggregatedData] = React.useState<RawDayAggregation[] | null>(null);
  const [weeklyAggregatedData, setWeeklyAggregatedData] = React.useState<RawWeekAggregation[] | null>(null);
  const [monthlyAggregatedData, setMonthlyAggregatedData] = React.useState<RawMonthAggregation[] | null>(null);
  
  const [activeView, setActiveView] = React.useState<ActiveView>(null);
  const [isLoadingView, setIsLoadingView] = React.useState(false);
  const [displayFormat, setDisplayFormat] = React.useState<DisplayFormat>('table');

  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);

  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeUsagePatternsOutput | null>(null);
  const [maintenanceSuggestion, setMaintenanceSuggestion] = React.useState<SuggestMaintenanceScheduleOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const { toast } = useToast();

  const handleDataLoadSubmit = (sessionDataText: string) => {
    setRawSessionData(sessionDataText);
    // Clear all processed and aggregated data as the source has changed
    setParsedSessions(null);
    setFilteredSessionViewData(null);
    setDailyAggregatedData(null);
    setWeeklyAggregatedData(null);
    setMonthlyAggregatedData(null);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);
    setActiveView(null); 
    setDisplayFormat('table');
    //setDateFrom(undefined); // Optionally reset date filters on new data load
    //setDateTo(undefined);
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

    let currentAllParsedSessions = parsedSessions;

    // Step 1: Parse raw data if not already parsed (e.g., on first view selection after data load)
    if (!currentAllParsedSessions) {
      try {
        currentAllParsedSessions = parseRawTextToSessions(rawSessionData);
        setParsedSessions(currentAllParsedSessions); // Store the full parsed set
      } catch (error: any) {
        console.error(`Error parsing raw session data:`, error);
        toast({
          variant: "destructive",
          title: `Error Parsing Data`,
          description: error instanceof SessionDataParsingError ? error.message : "An unexpected error occurred during parsing.",
        });
        setParsedSessions(null); // Ensure it's null on error
        setActiveView(null);
        setIsLoadingView(false);
        return;
      }
    }
    
    // Step 2: Apply date filtering to the full parsed set
    const effectiveSessions = currentAllParsedSessions.filter(session => {
      try {
        const loginDate = parseLoginTime(session.loginTime);
        const isAfterFrom = dateFrom ? loginDate.getTime() >= startOfDay(dateFrom).getTime() : true;
        const isBeforeTo = dateTo ? loginDate.getTime() <= endOfDay(dateTo).getTime() : true;
        return isAfterFrom && isBeforeTo;
      } catch (e) {
        // This should ideally not happen if initial parsing was successful
        console.warn("Error parsing loginTime during filtering:", e, session.loginTime);
        return false; 
      }
    });

    // Step 3: Process effectiveSessions for the selected viewType
    try {
      if (viewType === 'session') {
        const sortedSessions = [...effectiveSessions].sort((a, b) => {
          try {
            return parseLoginTime(b.loginTime).getTime() - parseLoginTime(a.loginTime).getTime();
          } catch (e) { return 0; }
        });
        setFilteredSessionViewData(sortedSessions);
        // Clear other aggregated data displays
        setDailyAggregatedData(null);
        setWeeklyAggregatedData(null);
        setMonthlyAggregatedData(null);
      } else if (viewType === 'daily') {
        const dailyData = aggregateSessionsByDay(effectiveSessions);
        setDailyAggregatedData(dailyData);
        setFilteredSessionViewData(null); 
        setWeeklyAggregatedData(null);
        setMonthlyAggregatedData(null);
      } else if (viewType === 'weekly') {
        const weeklyData = aggregateSessionsByWeek(effectiveSessions);
        setWeeklyAggregatedData(weeklyData);
        setFilteredSessionViewData(null);
        setDailyAggregatedData(null);
        setMonthlyAggregatedData(null);
      } else if (viewType === 'monthly') {
        const monthlyData = aggregateSessionsByMonth(effectiveSessions);
        setMonthlyAggregatedData(monthlyData);
        setFilteredSessionViewData(null);
        setDailyAggregatedData(null);
        setWeeklyAggregatedData(null);
      }
    } catch (error: any) {
      console.error(`Error processing data for ${viewType} view:`, error);
      toast({
        variant: "destructive",
        title: `Error Processing Data for ${viewType || 'selected'} view`,
        description: error instanceof SessionDataParsingError ? error.message : "An unexpected error occurred.",
      });
      // Potentially clear view-specific data on error
      if (viewType === 'session') setFilteredSessionViewData(null);
      if (viewType === 'daily') setDailyAggregatedData(null);
      // ... etc.
    } finally {
      setIsLoadingView(false);
    }
  };

  // Effect to re-process data when date filters change, if a view is active and data has been parsed
  React.useEffect(() => {
    if (activeView && parsedSessions) { // Only re-process if a view is active and base data is available
      processAndSetView(activeView);
    }
  }, [dateFrom, dateTo]); // `parsedSessions` is not needed here as `processAndSetView` uses it from state.


  const handleAiAnalysis = async () => {
    // AI Analysis should use the rawSessionData, or a filtered version if desired.
    // For now, it uses the full rawSessionData string.
    // If filtering is desired for AI, rawSessionData would need to be filtered and re-serialized to JSON.
    if (!rawSessionData) {
      toast({ variant: "destructive", title: "No Data", description: "Please load session data first." });
      return;
    }

    setIsLoadingAi(true);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);

    try {
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

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    // Re-processing will be triggered by the useEffect listening to dateFrom/dateTo
  };

  const renderViewContent = () => {
    if (isLoadingView) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[200px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Loading view data...</p>
        </div>
      );
    }

    const noDataMessage = <p className="text-muted-foreground text-center py-4">No data to display for the selected view, format, or date range. Please load data and select a view, or adjust filters.</p>;
    const chartNotImplementedMessage = (
        <Card>
            <CardHeader><CardTitle>Chart View</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                <Info className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Chart for this view is not yet implemented.</p>
            </CardContent>
        </Card>
    );


    switch (activeView) {
      case 'session':
        if (!filteredSessionViewData || filteredSessionViewData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? 
               <SessionDataTable sessions={filteredSessionViewData} /> : 
               <SessionTimelineChart sessions={filteredSessionViewData} />;
      case 'daily':
        if (!dailyAggregatedData || dailyAggregatedData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>Daily Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(dailyAggregatedData.map(d => ({...d, date: formatDate(d.date), totalDurationFormatted: formatDurationFromSeconds(d.totalDurationSeconds, true), totalDownloadedMB: d.totalDownloadedMB.toFixed(2), totalUploadedMB: d.totalUploadedMB.toFixed(2) })), null, 2)}</pre></CardContent>
          </Card>
        ) : chartNotImplementedMessage;
      case 'weekly':
        if (!weeklyAggregatedData || weeklyAggregatedData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>Weekly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(weeklyAggregatedData.map(w => ({...w, startDate: formatDate(w.startDate), endDate: formatDate(w.endDate), totalDurationFormatted: formatDurationFromSeconds(w.totalDurationSeconds, true), totalDownloadedMB: w.totalDownloadedMB.toFixed(2), totalUploadedMB: w.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : chartNotImplementedMessage;
      case 'monthly':
        if (!monthlyAggregatedData || monthlyAggregatedData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>Monthly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(monthlyAggregatedData.map(m => ({...m, startDate: formatDate(m.startDate), endDate: formatDate(m.endDate), totalDurationFormatted: formatDurationFromSeconds(m.totalDurationSeconds, true), totalDownloadedMB: m.totalDownloadedMB.toFixed(2), totalUploadedMB: m.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : chartNotImplementedMessage;
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
                  <CardTitle>View Options & Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Aggregation Level:</h4>
                      <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => processAndSetView('session')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'session' ? 'default' : 'outline'}><List className="mr-2 h-4 w-4" />Sessions</Button>
                          <Button onClick={() => processAndSetView('daily')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'daily' ? 'default' : 'outline'}><CalendarDays className="mr-2 h-4 w-4" />Daily</Button>
                          <Button onClick={() => processAndSetView('weekly')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'weekly' ? 'default' : 'outline'}><CalendarRange className="mr-2 h-4 w-4" />Weekly</Button>
                          <Button onClick={() => processAndSetView('monthly')} disabled={isLoadingView || !rawSessionData} variant={activeView === 'monthly' ? 'default' : 'outline'}><CalendarIconLucide className="mr-2 h-4 w-4" />Monthly</Button>
                      </div>
                   </div>

                   <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Filter by Date Range:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal text-sm" disabled={isLoadingView || !rawSessionData}>
                              <CalendarIconLucide className="mr-2 h-4 w-4" />
                              {dateFrom ? formatDate(dateFrom) : <span>Start date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus disabled={(date) => dateTo ? date > dateTo : false}/>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal text-sm" disabled={isLoadingView || !rawSessionData}>
                              <CalendarIconLucide className="mr-2 h-4 w-4" />
                              {dateTo ? formatDate(dateTo) : <span>End date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus disabled={(date) => dateFrom ? date < dateFrom : false} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {(dateFrom || dateTo) && (
                        <Button variant="ghost" size="sm" onClick={clearDateFilters} className="w-full text-xs" disabled={isLoadingView}>
                          <FilterX className="mr-1 h-3 w-3" /> Clear Date Filters
                        </Button>
                      )}
                    </div>

                    {activeView && (
                        <div className="pt-2">
                            <p className="text-sm font-medium mb-1 text-center text-muted-foreground">Display Format:</p>
                            <Tabs defaultValue="table" value={displayFormat} onValueChange={(value) => setDisplayFormat(value as DisplayFormat)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="table" disabled={isLoadingView}><TableIcon className="mr-2 h-4 w-4"/>Table</TabsTrigger>
                                <TabsTrigger value="chart" disabled={isLoadingView}><BarChart2 className="mr-2 h-4 w-4"/>Chart</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                  <Button 
                      onClick={handleAiAnalysis} 
                      disabled={isLoadingAi || !rawSessionData}
                      className="w-full mt-4"
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
            <AnomalyAlertDisplay /> {/* This component is currently static */}
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

