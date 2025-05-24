
"use client";

import * as React from "react";
import { AppHeader } from "@/components/session-insights/app-header";
import { DataInputForm } from "@/components/session-insights/data-input-form";
import { UsagePatternsDisplay } from "@/components/session-insights/usage-patterns-display";
import { MaintenanceSuggestionDisplay } from "@/components/session-insights/maintenance-suggestion-display";
import { AnomalyAlertDisplay } from "@/components/session-insights/anomaly-alert-display";
import { SessionDataTable } from "@/components/session-insights/session-data-table";
import { DailyAggregationTable } from "@/components/session-insights/tables/DailyAggregationTable";
import { SessionTimelineChart } from "@/components/session-insights/charts/SessionTimelineChart";
import { DailyAggregationChart } from "@/components/session-insights/charts/DailyAggregationChart";
import { WeeklyAggregationChart } from "@/components/session-insights/charts/WeeklyAggregationChart";
import { MonthlyAggregationChart } from "@/components/session-insights/charts/MonthlyAggregationChart";

import { analyzeUsagePatterns, type AnalyzeUsagePatternsOutput } from "@/ai/flows/analyze-usage-patterns";
import { suggestMaintenanceSchedule, type SuggestMaintenanceScheduleOutput } from "@/ai/flows/suggest-maintenance-schedule";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, List, CalendarDays, CalendarRange, Calendar as CalendarIconLucide, BarChart2, TableIcon, Info, FilterX, FileJson, Eye, EyeOff, Zap, BrainCircuit } from "lucide-react";
import type { SessionData, RawDayAggregation, RawWeekAggregation, RawMonthAggregation } from "@/lib/session-utils/types";
import { SessionDataParsingError } from "@/lib/session-utils/types";
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
import { aggregateSessionsByDay, aggregateSessionsByWeek, aggregateSessionsByMonth } from "@/lib/session-utils/aggregations";
import { formatDate, formatDurationFromSeconds, formatDataSizeForDisplay } from "@/lib/session-utils/formatters";
import { 
  startOfDay, endOfDay, subDays, 
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfYear, subYears, endOfYear, 
  startOfQuarter, endOfQuarter, subQuarters
} from 'date-fns';


type ActiveView = 'session' | 'daily' | 'weekly' | 'monthly' | null;
type ActiveViewNotNull = 'session' | 'daily' | 'weekly' | 'monthly';
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
  { label: "Last 30 Days", getRange: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "This Week (Mon-Sun)", getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Last Week (Mon-Sun)", getRange: () => {
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      return { from: lastWeekStart, to: lastWeekEnd };
    }
  },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Year to Date", getRange: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
];

const weeklyDatePresets: DatePreset[] = [
  { label: "Last 4 Weeks", getRange: () => ({ from: startOfWeek(subWeeks(new Date(), 3), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Last 12 Weeks", getRange: () => ({ from: startOfWeek(subWeeks(new Date(), 11), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "This Quarter", getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: "Last Quarter", getRange: () => { 
      const lq = subQuarters(new Date(), 1); 
      return { from: startOfQuarter(lq), to: endOfQuarter(lq) }; 
    } 
  },
  { label: "Year to Date (Weekly)", getRange: () => ({ from: startOfYear(new Date()), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Last Calendar Year", getRange: () => { 
      const ly = subYears(new Date(), 1); 
      return { from: startOfYear(ly), to: endOfYear(ly) };
    } 
  },
];

const monthlyDatePresets: DatePreset[] = [
  { label: "Last 3 Months", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
  { label: "Last 6 Months", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfMonth(new Date()) }) },
  { label: "Last 12 Months", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 11)), to: endOfMonth(new Date()) }) },
  { label: "This Quarter", getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: "Last Quarter", getRange: () => { 
      const lq = subQuarters(new Date(), 1); 
      return { from: startOfQuarter(lq), to: endOfQuarter(lq) }; 
    } 
  },
  { label: "Year to Date (Monthly)", getRange: () => ({ from: startOfYear(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Calendar Year", getRange: () => { 
      const ly = subYears(new Date(), 1); 
      return { from: startOfYear(ly), to: endOfYear(ly) };
    } 
  },
];


interface SmartFilterPresetConfig {
  label: string;
  type: 'TOP_N'; 
  nValue: number;
  metric:
    | 'totalUsage' 
    | 'download'
    | 'upload'
    | 'duration'
    | 'sessionCount'; 
  sortDirection: 'desc' | 'asc'; 
  description?: string;
}

const smartFilterPresetsByView: Record<ActiveViewNotNull, SmartFilterPresetConfig[]> = {
  session: [
    { label: "Top 5 Sessions (Max Download)", type: 'TOP_N', nValue: 5, metric: 'download', sortDirection: 'desc', description: "Sessions with the most data downloaded." },
    { label: "Top 5 Sessions (Longest Duration)", type: 'TOP_N', nValue: 5, metric: 'duration', sortDirection: 'desc', description: "Sessions that lasted the longest." },
    { label: "Top 5 Sessions (Max Upload)", type: 'TOP_N', nValue: 5, metric: 'upload', sortDirection: 'desc', description: "Sessions with the most data uploaded." },
  ],
  daily: [
    { label: "Top 5 Days (Max Total Usage)", type: 'TOP_N', nValue: 5, metric: 'totalUsage', sortDirection: 'desc', description: "Days with the highest combined download and upload." },
    { label: "Top 3 Days (Max Total Usage)", type: 'TOP_N', nValue: 3, metric: 'totalUsage', sortDirection: 'desc', description: "Top 3 days with the highest combined download and upload." },
    { label: "Top 5 Days (Min Total Usage)", type: 'TOP_N', nValue: 5, metric: 'totalUsage', sortDirection: 'asc', description: "Days with the lowest combined download and upload." },
    { label: "Top 5 Days (Max Download)", type: 'TOP_N', nValue: 5, metric: 'download', sortDirection: 'desc', description: "Days with the most data downloaded." },
    { label: "Top 5 Days (Longest Duration)", type: 'TOP_N', nValue: 5, metric: 'duration', sortDirection: 'desc', description: "Days with the longest total session duration." },
  ],
  weekly: [
     { label: "Top 3 Weeks (Max Total Usage)", type: 'TOP_N', nValue: 3, metric: 'totalUsage', sortDirection: 'desc', description: "Weeks with the highest combined download and upload." },
     { label: "Top 3 Weeks (Min Total Usage)", type: 'TOP_N', nValue: 3, metric: 'totalUsage', sortDirection: 'asc', description: "Weeks with the lowest combined download and upload." },
  ],
  monthly: [
    { label: "Top 3 Months (Max Total Usage)", type: 'TOP_N', nValue: 3, metric: 'totalUsage', sortDirection: 'desc', description: "Months with the highest combined download and upload." },
    { label: "Top 3 Months (Min Total Usage)", type: 'TOP_N', nValue: 3, metric: 'totalUsage', sortDirection: 'asc', description: "Months with the lowest combined download and upload." },
  ],
};


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
  const [displayFormat, setDisplayFormat] = React.useState<DisplayFormat>('chart');

  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  const [currentDatePresets, setCurrentDatePresets] = React.useState<DatePreset[]>([]);
  const [isDataInputVisible, setIsDataInputVisible] = React.useState(true);

  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeUsagePatternsOutput | null>(null);
  const [maintenanceSuggestion, setMaintenanceSuggestion] = React.useState<SuggestMaintenanceScheduleOutput | null>(null);
  const [isLoadingAi, setIsLoadingAi] = React.useState(false);
  const { toast } = useToast();
  const aiResultsRef = React.useRef<HTMLDivElement>(null);

  const [isLoadingSmartFilters, setIsLoadingSmartFilters] = React.useState(false);
  const [showSmartFiltersUI, setShowSmartFiltersUI] = React.useState(false);
  const [smartFilteredDisplayData, setSmartFilteredDisplayData] = React.useState<any[] | null>(null);
  const [activeSmartFilterLabel, setActiveSmartFilterLabel] = React.useState<string | null>(null);


  React.useEffect(() => {
    if (!rawSessionData) {
        setCurrentDatePresets([]); 
        return;
    }
    setSmartFilteredDisplayData(null);
    setActiveSmartFilterLabel(null);

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
             setCurrentDatePresets(sessionDailyDatePresets); 
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
    setDisplayFormat('chart');
    setDateFrom(undefined);
    setDateTo(undefined);
    setIsDataInputVisible(false);
    setShowSmartFiltersUI(false);
    setSmartFilteredDisplayData(null);
    setActiveSmartFilterLabel(null);
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
    setSmartFilteredDisplayData(null); 
    setActiveSmartFilterLabel(null);

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
  }, [dateFrom, dateTo]); 


  const handleAiAnalysis = async () => {
    if (!rawSessionData) {
      toast({ variant: "destructive", title: "No Data", description: "Please load session data first." });
      return;
    }

    setIsLoadingAi(true);
    setAnalysisResult(null);
    setMaintenanceSuggestion(null);
    
    // Scroll to AI results section
    setTimeout(() => { // Timeout to allow state to update and ref to be available
        aiResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);


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
    setSmartFilteredDisplayData(null);
    setActiveSmartFilterLabel(null);
  };

  const applyDatePreset = (preset: DatePreset) => {
    const { from, to } = preset.getRange();
    setDateFrom(from);
    setDateTo(to);
    setSmartFilteredDisplayData(null);
    setActiveSmartFilterLabel(null);
  };

  const handleActivateSmartFilters = () => {
    if (!activeView) {
      toast({ variant: "destructive", title: "Select a View", description: "Please select an aggregation level (Session, Daily, etc.) before using smart filters." });
      return;
    }
    setIsLoadingSmartFilters(true);
    setTimeout(() => { 
      setShowSmartFiltersUI(prev => !prev); 
      if (showSmartFiltersUI) { 
        setSmartFilteredDisplayData(null);
        setActiveSmartFilterLabel(null);
      }
      setIsLoadingSmartFilters(false);
    }, 200); 
  };

  const handleSmartFilterApply = (config: SmartFilterPresetConfig) => {
    if (!activeView) return; 
    setIsLoadingView(true); 
    setActiveSmartFilterLabel(config.label);

    let sourceData: any[] = [];
    if (activeView === 'session' && filteredSessionViewData) sourceData = filteredSessionViewData;
    else if (activeView === 'daily' && dailyAggregatedData) sourceData = dailyAggregatedData;
    else if (activeView === 'weekly' && weeklyAggregatedData) sourceData = weeklyAggregatedData;
    else if (activeView === 'monthly' && monthlyAggregatedData) sourceData = monthlyAggregatedData;


    if (sourceData.length === 0) {
        toast({ title: "No Data for Smart Filter", description: "The current view has no data to apply smart filters on.", variant: "default" });
        setSmartFilteredDisplayData([]);
        setIsLoadingView(false);
        return;
    }
    
    const getMetricValue = (item: any): number => {
      switch (config.metric) {
        case 'download':
          return activeView === 'session' ? item.download : item.totalDownloadedMB;
        case 'upload':
          return activeView === 'session' ? item.upload : item.totalUploadedMB;
        case 'totalUsage':
          return activeView === 'session' 
            ? item.download + item.upload 
            : item.totalDownloadedMB + item.totalUploadedMB;
        case 'duration':
          return activeView === 'session' 
            ? parseSessionDurationToSeconds(item.sessionTime) 
            : item.totalDurationSeconds;
        case 'sessionCount':
            return activeView !== 'session' ? item.sessionCount : 0; 
        default:
          return 0;
      }
    };

    const sortedData = [...sourceData].sort((a, b) => {
      const valA = getMetricValue(a);
      const valB = getMetricValue(b);
      return config.sortDirection === 'desc' ? valB - valA : valA - valB;
    });

    setSmartFilteredDisplayData(sortedData.slice(0, config.nValue));
    setIsLoadingView(false);
  };


  const renderViewContent = () => {
    if (isLoadingView) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-lg min-h-[300px]">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <p className="text-xl font-medium text-primary mb-1">
            {activeSmartFilterLabel ? `Applying: ${activeSmartFilterLabel}` : "Processing Data"}
          </p>
          <p className="text-muted-foreground">Crunching the numbers, please wait...</p>
        </div>
      );
    }
    
    const dataToDisplay = smartFilteredDisplayData || (
        activeView === 'session' ? filteredSessionViewData :
        activeView === 'daily' ? dailyAggregatedData :
        activeView === 'weekly' ? weeklyAggregatedData :
        activeView === 'monthly' ? monthlyAggregatedData :
        null
    );

    const noDataFilteredMessage = (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg min-h-[300px] text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No Data to Display</p>
          <p className="text-sm text-muted-foreground">
            {activeSmartFilterLabel ? `The smart filter "${activeSmartFilterLabel}" yielded no results for the current selection.` : 
            "No sessions match your current filters or selected view. Try adjusting the date range or select a different view."}
          </p>
        </div>
    );

    const chartTitlePrefix = activeSmartFilterLabel ? `${activeSmartFilterLabel} - ` : "";

    switch (activeView) {
      case 'session':
        if (!dataToDisplay || dataToDisplay.length === 0) return noDataFilteredMessage;
        return displayFormat === 'table' ? 
               <SessionDataTable sessions={dataToDisplay as SessionData[]} /> : 
               <SessionTimelineChart sessions={dataToDisplay as SessionData[]} />;
      case 'daily':
        if (!dataToDisplay || dataToDisplay.length === 0) return noDataFilteredMessage;
        return displayFormat === 'table' ? (
          <DailyAggregationTable data={dataToDisplay as RawDayAggregation[]} />
        ) : <DailyAggregationChart data={dataToDisplay as RawDayAggregation[]} chartTitlePrefix={chartTitlePrefix}/>;
      case 'weekly':
        if (!dataToDisplay || dataToDisplay.length === 0) return noDataFilteredMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>{chartTitlePrefix}Weekly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify((dataToDisplay as RawWeekAggregation[]).map(w => ({...w, startDate: formatDate(w.startDate), endDate: formatDate(w.endDate), totalDurationFormatted: formatDurationFromSeconds(w.totalDurationSeconds, true), totalDownloadedMB: w.totalDownloadedMB.toFixed(2), totalUploadedMB: w.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <WeeklyAggregationChart data={dataToDisplay as RawWeekAggregation[]} chartTitlePrefix={chartTitlePrefix}/>;
      case 'monthly':
        if (!dataToDisplay || dataToDisplay.length === 0) return noDataFilteredMessage;
        return displayFormat === 'table' ? (
          <Card>
            <CardHeader><CardTitle>{chartTitlePrefix}Monthly Aggregated Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[400px]">{JSON.stringify((dataToDisplay as RawMonthAggregation[]).map(m => ({...m, startDate: formatDate(m.startDate), endDate: formatDate(m.endDate), totalDurationFormatted: formatDurationFromSeconds(m.totalDurationSeconds, true), totalDownloadedMB: m.totalDownloadedMB.toFixed(2), totalUploadedMB: m.totalUploadedMB.toFixed(2)})), null, 2)}</pre></CardContent>
          </Card>
        ) : <MonthlyAggregationChart data={dataToDisplay as RawMonthAggregation[]} chartTitlePrefix={chartTitlePrefix} />;
      default:
        if (rawSessionData) { 
            return (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg min-h-[300px] text-center">
                  <List className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-1">Data Loaded, Select a View</p>
                  <p className="text-sm text-muted-foreground">
                    Choose Session, Daily, Weekly, or Monthly to process and display your data.
                  </p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg min-h-[300px] text-center">
                <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-1">Load Your Session Data</p>
                <p className="text-sm text-muted-foreground">
                Use the form on the left to input your session data in JSON format.
                </p>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow px-4 md:px-6 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sticky Left Column */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:self-start lg:pr-4">
           
            {rawSessionData ? ( 
              isDataInputVisible ? (
                <>
                  <Button variant="outline" onClick={() => setIsDataInputVisible(false)} className="w-full">
                    <EyeOff className="mr-2 h-4 w-4" /> Hide Data Input
                  </Button>
                  <DataInputForm 
                    onSubmit={handleDataLoadSubmit} 
                    isLoading={isLoadingView || isLoadingAi || isLoadingSmartFilters} 
                  />
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsDataInputVisible(true)} className="w-full">
                  <Eye className="mr-2 h-4 w-4" /> Show Data Input
                </Button>
              )
            ) : ( 
              <DataInputForm 
                onSubmit={handleDataLoadSubmit} 
                isLoading={isLoadingView || isLoadingAi || isLoadingSmartFilters} 
              />
            )}
            
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
                            <ScrollArea className={`w-full rounded-md ${showSmartFiltersUI ? 'max-h-20' : 'max-h-48'} transition-all duration-300`}> 
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1"> 
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

                    {showSmartFiltersUI && activeView && smartFilterPresetsByView[activeView as ActiveViewNotNull] && (
                      <Card className="mt-4 border-primary/50">
                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/>Smart Filters</CardTitle>
                          <CardDescription className="text-xs">Apply data-driven filters to the current view & date range.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="grid grid-cols-1 gap-2">
                            {smartFilterPresetsByView[activeView as ActiveViewNotNull].map(sfPreset => (
                              <Button
                                key={sfPreset.label}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSmartFilterApply(sfPreset)}
                                disabled={isLoadingView}
                                className="text-xs justify-start"
                                title={sfPreset.description}
                              >
                                {sfPreset.label}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}


                    {activeView && ( 
                        <div className="pt-4">
                            <p className="text-sm font-medium mb-1 text-center text-muted-foreground">Display Format:</p>
                            <Tabs defaultValue="chart" value={displayFormat} onValueChange={(value) => setDisplayFormat(value as DisplayFormat)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="table" disabled={isLoadingView}><TableIcon className="mr-2 h-4 w-4"/>Table</TabsTrigger>
                                <TabsTrigger value="chart" disabled={isLoadingView}><BarChart2 className="mr-2 h-4 w-4"/>Chart</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                   <Button 
                        onClick={handleActivateSmartFilters}
                        disabled={isLoadingSmartFilters || !rawSessionData || !activeView}
                        className="w-full mt-4"
                        variant="outline"
                    >
                        {isLoadingSmartFilters ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Smart Filters...</>
                        ) : (
                            <><Zap className="mr-2 h-4 w-4" />{showSmartFiltersUI ? "Hide Smart Filters" : "Use Smart Filters"}</>
                        )}
                    </Button>
                    {showSmartFiltersUI && 
                        <Button variant="outline" size="sm" className="w-full text-xs mt-1" onClick={() => {setShowSmartFiltersUI(false); setSmartFilteredDisplayData(null); setActiveSmartFilterLabel(null); if (activeView) processAndSetView(activeView);}}>
                            Clear Smart Filter & View Options
                        </Button>
                    }

                  <Button 
                      onClick={handleAiAnalysis} 
                      disabled={isLoadingAi || !rawSessionData}
                      className="w-full mt-6"
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
          {/* Right Scrollable Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {renderViewContent()}
            
            <div ref={aiResultsRef} className="space-y-8"> {/* AI Results Container */}
              {isLoadingAi && (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-lg min-h-[300px] bg-card">
                  <div className="flex items-center gap-4 mb-6">
                    <BrainCircuit className="h-16 w-16 text-primary animate-pulse" />
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  </div>
                  <p className="text-2xl font-semibold text-primary mb-2">AI Brain at Work...</p>
                  <p className="text-muted-foreground">Analyzing your data to uncover insights. Please wait a moment.</p>
                </div>
              )}

              {!isLoadingAi && (analysisResult || maintenanceSuggestion) && (
                <>
                  {analysisResult && <UsagePatternsDisplay data={analysisResult} />}
                  {maintenanceSuggestion && <MaintenanceSuggestionDisplay data={maintenanceSuggestion} />}
                  <AnomalyAlertDisplay />
                </>
              )}
            </div>
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
