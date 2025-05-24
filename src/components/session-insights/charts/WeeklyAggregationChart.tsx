
"use client";

import * as React from "react";
import type { RawWeekAggregation } from "@/lib/session-utils/types";
import { formatDate, formatDataSizeForDisplay, formatDurationFromSeconds, getDaysInPeriod } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart"; // Removed ChartTooltip, ChartLegend from here
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"; // Keep these specific Recharts imports
import { TrendingUp, Download, Upload, Clock, PowerOff } from "lucide-react";

interface WeeklyAggregationChartProps {
  data: RawWeekAggregation[];
  chartTitlePrefix?: string;
}

const chartConfig = {
  totalDownloadedMB: {
    label: "Download (MB)",
    color: "hsl(var(--chart-1))",
    icon: Download,
  },
  totalUploadedMB: {
    label: "Upload (MB)",
    color: "hsl(var(--chart-2))",
    icon: Upload,
  },
} satisfies ChartConfig;

type ChartDataItem = {
  weekLabel: string; 
  timestamp: number; 
  totalDownloadedMB: number;
  totalUploadedMB: number;
  totalDurationSeconds: number; 
  startDate: Date; 
  endDate: Date;
};

const SECONDS_IN_A_DAY = 86400;

export function WeeklyAggregationChart({ data, chartTitlePrefix = "" }: WeeklyAggregationChartProps) {
  const chartData = React.useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    return data
      .map((agg) => ({
        weekLabel: `W${agg.weekNumber} (${formatDate(agg.startDate)})`, 
        timestamp: agg.startDate.getTime(),
        totalDownloadedMB: parseFloat(agg.totalDownloadedMB.toFixed(2)),
        totalUploadedMB: parseFloat(agg.totalUploadedMB.toFixed(2)),
        totalDurationSeconds: agg.totalDurationSeconds,
        startDate: agg.startDate,
        endDate: agg.endDate,
      }))
      .sort((a, b) => a.timestamp - b.timestamp); 
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{chartTitlePrefix}Weekly Aggregation Chart</CardTitle>
          <CardDescription>No weekly aggregated data to display.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Please load and process data for weekly view.</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: ChartDataItem = payload[0].payload;
      const originalPoint = data.find(d => `W${d.weekNumber} (${formatDate(d.startDate)})` === label);
      const weekDisplay = originalPoint ? `${formatDate(originalPoint.startDate)} - ${formatDate(originalPoint.endDate)}` : label;
      
      const daysInWeek = originalPoint ? getDaysInPeriod(originalPoint.startDate, originalPoint.endDate) : 7;
      const totalSecondsInPeriod = daysInWeek * SECONDS_IN_A_DAY;
      const inactiveDurationSeconds = totalSecondsInPeriod - dataPoint.totalDurationSeconds;

      return (
        <div className="bg-background border p-3 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">Week: {weekDisplay}</p>
          {dataPoint.totalDurationSeconds !== undefined && (
             <p className="flex items-center"><Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />Active: {formatDurationFromSeconds(dataPoint.totalDurationSeconds, true)}</p>
          )}
           <p className="flex items-center"><PowerOff className="mr-1.5 h-4 w-4 text-muted-foreground" />Inactive: {formatDurationFromSeconds(inactiveDurationSeconds > 0 ? inactiveDurationSeconds : 0, true)}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.stroke }} className="flex items-center">
              {pld.dataKey === 'totalDownloadedMB' && <Download className="mr-1.5 h-4 w-4" />}
              {pld.dataKey === 'totalUploadedMB' && <Upload className="mr-1.5 h-4 w-4" />}
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
          <TrendingUp className="h-6 w-6 text-primary" />
          <CardTitle>{chartTitlePrefix}Weekly Aggregated Data Trends</CardTitle>
        </div>
        <CardDescription>
          Weekly total download and upload volume trends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[70vh] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: chartData.length > 7 ? 60 : 5, 
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={true}
              tickMargin={10}
              angle={chartData.length > 7 ? -45 : 0}
              textAnchor={chartData.length > 7 ? "end" : "middle"}
              minTickGap={0}
              interval={chartData.length > 15 ? Math.floor(chartData.length / 8) : 0}
            />
            <YAxis 
                label={{ value: "Data (MB)", angle: -90, position: 'insideLeft', offset:10 }}
                tickFormatter={(value) => formatDataSizeForDisplay(value,0)}
            />
            <RechartsTooltip content={<ChartTooltipContent hideIndicator formatter={(value, name, item) => {
              const dataKey = item.dataKey as keyof typeof chartConfig;
              const config = chartConfig[dataKey];
              return (
                <div className="flex items-center gap-1.5">
                   {config?.icon ? <config.icon className="h-4 w-4" style={{color: config.color}} /> : null}
                  <span>{config?.label || name}: {formatDataSizeForDisplay(value as number)}</span>
                </div>
              );
            }} />} cursor={{ strokeDasharray: '3 3' }}/>
            <RechartsLegend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
            <Line
              type="monotone"
              dataKey="totalDownloadedMB"
              stroke="var(--color-totalDownloadedMB)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={chartConfig.totalDownloadedMB.label}
            />
            <Line
              type="monotone"
              dataKey="totalUploadedMB"
              stroke="var(--color-totalUploadedMB)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={chartConfig.totalUploadedMB.label}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

    