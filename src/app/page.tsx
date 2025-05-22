
"use client";

import * as React from "react";
import { AppHeader } from "@/components/session-insights/app-header";
import { DataInputForm } from "@/components/session-insights/data-input-form";
import { UsagePatternsDisplay } from "@/components/session-insights/usage-patterns-display";
import { MaintenanceSuggestionDisplay } from "@/components/session-insights/maintenance-suggestion-display";
import { AnomalyAlertDisplay } from "@/components/session-insights/anomaly-alert-display";
import { SessionDataTable } from "@/components/session-insights/session-data-table";
import { SessionTimelineChart } from "@/components/session-insights/charts/SessionTimelineChart";
import { DailyAggregationChart } from "@/components/session-insights/charts/DailyAggregationChart";
import { WeeklyAggregationChart } from "@/components/session-insights/charts/WeeklyAggregationChart";
import { MonthlyAggregationChart } from "@/components/session-insights/charts/MonthlyAggregationChart";

import { analyzeUsagePatterns, type AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { suggestMaintenanceSchedule, type SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, List, CalendarDays, CalendarRange, Calendar as CalendarIconLucide, BarChart2, TableIcon, Info, FilterX } from "lucide-react";
import type { SessionData, RawDayAggregation, RawWeekAggregation, RawMonthAggregation } from "@/lib/session-utils/types";
import { SessionDataParsingError } from "@/lib/session-utils/types";
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
import { aggregateSessionsByDay, aggregateSessionsByWeek, aggregateSessionsByMonth } from "@/lib/session-utils/aggregations";
import { formatDate, formatDurationFromSeconds } from "@/lib/session-utils/formatters";
import { 
  startOfDay, endOfDay, subDays, 
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters
} from 'date-fns';


type ActiveView = 'session' | 'daily' | 'weekly' | 'monthly' | null;
type DisplayFormat = 'table' | 'chart';

interface DatePreset {
  label: string;
  getRange: () => { from: Date; to: Date };
}

const sessionDailyDatePresets: DatePreset[] = [
  { label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Yesterday", getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
  },
  { label: "Last 7 Days", getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "This Week", getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Last Week", getRange: () => {
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      return { from: lastWeekStart, to: lastWeekEnd };
    }
  },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getRange: () => {
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
      return { from: lastMonthStart, to: lastMonthEnd };
    }
  },
  { label: "This Year", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: "Last Year", getRange: () => {
      const lastYearStart = startOfYear(subYears(new Date(), 1));
      const lastYearEnd = endOfYear(subYears(new Date(), 1));
      return { from: lastYearStart, to: lastYearEnd };
    }
  },
];

const weeklyDatePresets: DatePreset[] = [
  { label: "This Week", getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Last Week", getRange: () => { const lw = subWeeks(new Date(), 1); return { from: startOfWeek(lw, { weekStartsOn: 1 }), to: endOfWeek(lw, { weekStartsOn: 1 }) }; } },
  { label: "Last 4 Weeks", getRange: () => ({ from: startOfWeek(subWeeks(new Date(), 3), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "This Quarter", getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: "Last Quarter", getRange: () => { const lq = subQuarters(new Date(), 1); return { from: startOfQuarter(lq), to: endOfQuarter(lq) }; } },
  { label: "This Year", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: "Last Year", getRange: () => { const ly = subYears(new Date(), 1); return { from: startOfYear(ly), to: endOfYear(ly) }; } },
];

const monthlyDatePresets: DatePreset[] = [
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getRange: () => { const lm = subMonths(new Date(), 1); return { from: startOfMonth(lm), to: endOfMonth(lm) }; } },
  { label: "Last 3 Months", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
  { label: "Last 6 Months", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfMonth(new Date()) }) },
  { label: "This Quarter", getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: "Last Quarter", getRange: () => { const lq = subQuarters(new Date(), 1); return { from: startOfQuarter(lq), to: endOfQuarter(lq) }; } },
  { label: "This Year", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: "Last Year", getRange: () => { const ly = subYears(new Date(), 1); return { from: startOfYear(ly), to: endOfYear(ly) }; } },
];


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
  const [parsedSessions, setParsedSessions] = React.useState<SessionData[] | null>(null); 
  
  const [filteredSessionViewData, setFilteredSessionViewData] = React.useState<SessionData[] | null>(null);
  const [dailyAggregatedData, setDailyAggregatedData] = React.useState<RawDayAggregation[] | null>(null);
  const [weeklyAggregatedData, setWeeklyAggregatedData] = React.useState<RawWeekAggregation[] | null>(null);
  const [monthlyAggregatedData, setMonthlyAggregatedData] = React.useState<RawMonthAggregation[] | null>(null);
  
  const [activeView, setActiveView] = React.useState<ActiveView>(null);
  const [isLoadingView, setIsLoadingView] = React.useState(false);
  const [displayFormat, setDisplayFormat] = React.useState<DisplayFormat>('table');

  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  const [currentDatePresets, setCurrentDatePresets] = React.useState<DatePreset[]>(sessionDailyDatePresets);


  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeUsagePatternsOutput | null>(null);
  const [maintenanceSuggestion, setMaintenanceSuggestion] = React.useState<SuggestMaintenanceScheduleOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    switch (activeView) {
        case 'session':
        case 'daily':
            setCurrentDatePresets(sessionDailyDatePresets);
            break;
        case 'weekly':
            setCurrentDatePresets(weeklyDatePresets);
            break;
        case 'monthly':
            setCurrentDatePresets(monthlyDatePresets);
            break;
        default:
             // When rawSessionData is loaded but no view is active yet, or for null activeView
            setCurrentDatePresets(rawSessionData ? sessionDailyDatePresets : []); 
            break;
    }
  }, [activeView, rawSessionData]);

  const handleDataLoadSubmit = (sessionDataText: string) => {
    setRawSessionData(sessionDataText);
    setParsedSessions(null);
    setFilteredSessionViewData(null);
    setDailyAggregatedData(null);
    setWeeklyAggregatedData(null);
    setMonthlyAggregatedData(null);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);
    setActiveView(null); 
    setDisplayFormat('table');
    // Reset date filters when new data is loaded
    setDateFrom(undefined);
    setDateTo(undefined);
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
    setActiveView(viewType); // Set active view first to trigger preset update if needed

    let currentAllParsedSessions = parsedSessions;

    if (!currentAllParsedSessions) {
      try {
        currentAllParsedSessions = parseRawTextToSessions(rawSessionData);
        setParsedSessions(currentAllParsedSessions);
      } catch (error: any) {
        console.error(`Error parsing raw session data:`, error);
        toast({
          variant: "destructive",
          title: `Error Parsing Data`,
          description: error instanceof SessionDataParsingError ? error.message : "An unexpected error occurred during parsing.",
        });
        setParsedSessions(null);
        setActiveView(null);
        setIsLoadingView(false);
        return;
      }
    }
    
    const effectiveSessions = currentAllParsedSessions.filter(session => {
      try {
        const loginDate = parseLoginTime(session.loginTime);
        const isAfterFrom = dateFrom ? loginDate.getTime() >= startOfDay(dateFrom).getTime() : true;
        const isBeforeTo = dateTo ? loginDate.getTime() <= endOfDay(dateTo).getTime() : true;
        return isAfterFrom && isBeforeTo;
      } catch (e) {
        console.warn("Error parsing loginTime during filtering:", e, session.loginTime);
        return false; 
      }
    });

    try {
      if (viewType === 'session') {
        const sortedSessions = [...effectiveSessions].sort((a, b) => {
          try {
            return parseLoginTime(b.loginTime).getTime() - parseLoginTime(a.loginTime).getTime();
          } catch (e) { return 0; }
        });
        setFilteredSessionViewData(sortedSessions);
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
      if (viewType === 'session') setFilteredSessionViewData(null);
      if (viewType === 'daily') setDailyAggregatedData(null);
      if (viewType === 'weekly') setWeeklyAggregatedData(null);
      if (viewType === 'monthly') setMonthlyAggregatedData(null);
    } finally {
      setIsLoadingView(false);
    }
  };

  React.useEffect(() => {
    if (activeView && (rawSessionData || parsedSessions)) { 
      processAndSetView(activeView);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]); // Re-run if date filters change and an active view and data are present.
                         // We don't add activeView here directly, because processAndSetView is called when activeView changes.
                         // processAndSetView itself will use the current dateFrom/dateTo.


  const handleAiAnalysis = async () => {
    if (!rawSessionData) {
      toast({ variant: "destructive", title: "No Data", description: "Please load session data first." });
      return;
    }

    setIsLoadingAi(true);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);

    try {
      // For AI analysis, we use the rawSessionData which might represent the complete dataset,
      // irrespective of current date filters. If AI should also consider filters, this logic needs change.
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
    // Re-process view with cleared filters if an active view exists
    if (activeView && (rawSessionData || parsedSessions)) {
        processAndSetView(activeView);
    }
  };

  const applyDatePreset = (preset: DatePreset) => {
    const { from, to } = preset.getRange();
    setDateFrom(from);
    setDateTo(to);
     // Re-process view with new preset filters if an active view exists
    if (activeView && (rawSessionData || parsedSessions)) {
        // processAndSetView will be triggered by useEffect on dateFrom/dateTo change
    }
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
        ) : <DailyAggregationChart data={dailyAggregatedData} />;
      case 'weekly':
        if (!weeklyAggregatedData || weeklyAggregatedData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>Weekly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(weeklyAggregatedData.map(w => ({...w, startDate: formatDate(w.startDate), endDate: formatDate(w.endDate), totalDurationFormatted: formatDurationFromSeconds(w.totalDurationSeconds, true), totalDownloadedMB: w.totalDownloadedMB.toFixed(2), totalUploadedMB: w.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <WeeklyAggregationChart data={weeklyAggregatedData} />;
      case 'monthly':
        if (!monthlyAggregatedData || monthlyAggregatedData.length === 0) return noDataMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>Monthly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify(monthlyAggregatedData.map(m => ({...m, startDate: formatDate(m.startDate), endDate: formatDate(m.endDate), totalDurationFormatted: formatDurationFromSeconds(m.totalDurationSeconds, true), totalDownloadedMB: m.totalDownloadedMB.toFixed(2), totalUploadedMB: m.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <MonthlyAggregationChart data={monthlyAggregatedData} />;
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
                    </div>
                    
                    {currentDatePresets.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Date Presets:</h4>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                                <div className="flex space-x-2 pb-2">
                                    {currentDatePresets.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyDatePreset(preset)}
                                        disabled={isLoadingView || !rawSessionData}
                                        className="text-xs"
                                    >
                                        {preset.label}
                                    </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    )}

                    {(dateFrom || dateTo) && (
                      <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearDateFilters} 
                          className="w-full text-xs text-destructive border-destructive hover:bg-destructive/5 hover:text-destructive mt-2" 
                          disabled={isLoadingView}
                      >
                        <FilterX className="mr-1 h-3 w-3" /> Clear Date Filters
                      </Button>
                    )}

                    {activeView && (
                        <div className="pt-4">
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
                      className="w-full mt-6" // Increased top margin
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
            {!isLoadingAi && (analysisResult || maintenanceSuggestion) && (
                 <AnomalyAlertDisplay /> 
            )}
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

