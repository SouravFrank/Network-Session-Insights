
"use client";

import * as React from "react";
import type { SessionData } from "@/lib/session-utils/types";
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
import { formatDurationFromSeconds, formatDataSizeForDisplay, formatDate } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { Activity, Download, Upload, Clock } from "lucide-react";

interface SessionTimelineChartProps {
  sessions: SessionData[];
}

const chartConfig = {
  download: {
    label: "Download (MB)",
    color: "hsl(var(--chart-1))",
    icon: Download,
  },
  upload: {
    label: "Upload (MB)",
    color: "hsl(var(--chart-2))",
    icon: Upload,
  },
} satisfies ChartConfig;

type ChartDataItem = {
  timestamp: number; // Unix timestamp for X-axis
  loginTimeISO: string;
  download: number;
  upload: number;
  durationSeconds: number;
  sessionTimeFormatted: string;
  loginDateTimeFormatted: string;
};

export function SessionTimelineChart({ sessions }: SessionTimelineChartProps) {
  const chartData = React.useMemo((): ChartDataItem[] => {
    if (!sessions || sessions.length === 0) return [];
    return sessions
      .map((session) => {
        try {
          const loginDate = parseLoginTime(session.loginTime);
          const durationSeconds = parseSessionDurationToSeconds(session.sessionTime);
          return {
            timestamp: loginDate.getTime(),
            loginTimeISO: loginDate.toISOString(),
            download: session.download,
            upload: session.upload,
            durationSeconds: durationSeconds,
            sessionTimeFormatted: formatDurationFromSeconds(durationSeconds, true),
            loginDateTimeFormatted: `${formatDate(loginDate)} ${loginDate.toLocaleTimeString()}`,
          };
        } catch (error) {
          console.error("Error parsing session for chart:", error, session);
          return null;
        }
      })
      .filter((item): item is ChartDataItem => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure data is sorted by time
  }, [sessions]);

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Timeline</CardTitle>
          <CardDescription>No session data to display in chart.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Please load valid session data.</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataItem = payload[0].payload;
      return (
        <div className="bg-background border p-3 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">{data.loginDateTimeFormatted}</p>
          <p className="flex items-center"><Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />Duration: {data.sessionTimeFormatted}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }} className="flex items-center">
              {pld.dataKey === 'download' && <Download className="mr-1.5 h-4 w-4" />}
              {pld.dataKey === 'upload' && <Upload className="mr-1.5 h-4 w-4" />}
              {pld.name}: {formatDataSizeForDisplay(pld.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <CardTitle>Session Timeline</CardTitle>
        </div>
        <CardDescription>
          Timeline of individual session downloads and uploads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => {
                const date = new Date(unixTime);
                // Show date if it's the first tick or the date has changed significantly
                // This logic can be improved for better tick distribution
                return `${formatDate(date)} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              }}
              tickCount={chartData.length > 20 ? 10 : chartData.length > 5 ? 5 : undefined} // Adjust tick count based on data
              angle={chartData.length > 10 ? -30 : 0}
              textAnchor={chartData.length > 10 ? "end" : "middle"}
              height={chartData.length > 10 ? 70 : 30}
              minTickGap={20}
              
            />
            <YAxis 
                yAxisId="left" 
                label={{ value: "Data (MB)", angle: -90, position: 'insideLeft', offset:10 }}
                tickFormatter={(value) => formatDataSizeForDisplay(value,0)}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }}/>
            <RechartsLegend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="download"
              stroke="var(--color-download)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={chartConfig.download.label}
            />
            <Line
              yAxisId="left" 
              type="monotone"
              dataKey="upload"
              stroke="var(--color-upload)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={chartConfig.upload.label}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
