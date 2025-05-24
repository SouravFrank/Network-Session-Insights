
"use client";

import * as React from "react";
import type { RawMonthAggregation } from "@/lib/session-utils/types";
import { formatDataSizeForDisplay, formatDurationFromSeconds, getDaysInPeriod } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent } from "@/components/ui/chart"; 
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"; 
import { BarChartBig, Download, Upload, Clock, PowerOff } from "lucide-react";

interface MonthlyAggregationChartProps {
  data: RawMonthAggregation[];
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
  monthLabel: string; 
  timestamp: number; 
  totalDownloadedMB: number;
  totalUploadedMB: number;
  totalDurationSeconds: number; 
  startDate: Date; 
  endDate: Date;
};

const SECONDS_IN_A_DAY = 86400;

export function MonthlyAggregationChart({ data, chartTitlePrefix = "" }: MonthlyAggregationChartProps) {
  const chartData = React.useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    return data
      .map((agg) => ({
        monthLabel: `${agg.monthName.substring(0,3)} ${agg.year}`,
        timestamp: agg.startDate.getTime(),
        totalDownloadedMB: parseFloat(agg.totalDownloadedMB.toFixed(2)),
        totalUploadedMB: parseFloat(agg.totalUploadedMB.toFixed(2)),
        totalDurationSeconds: agg.totalDurationSeconds,
        startDate: agg.startDate,
        endDate: agg.endDate,
      }))
      .sort((a, b) => a.timestamp - b.timestamp); 
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: ChartDataItem = payload[0].payload;
      const originalPoint = data.find(d => `${d.monthName.substring(0,3)} ${d.year}` === label);
      const monthDisplay = originalPoint ? `${originalPoint.monthName} ${originalPoint.year}` : label;

      const daysInMonth = originalPoint ? getDaysInPeriod(originalPoint.startDate, originalPoint.endDate) : 30; 
      const totalSecondsInPeriod = daysInMonth * SECONDS_IN_A_DAY;
      const inactiveDurationSeconds = totalSecondsInPeriod - dataPoint.totalDurationSeconds;

      return (
        <div className="bg-background border p-3 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">Month: {monthDisplay}</p>
          {dataPoint.totalDurationSeconds !== undefined && (
             <p className="flex items-center"><Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />Active: {formatDurationFromSeconds(dataPoint.totalDurationSeconds, true)}</p>
          )}
          <p className="flex items-center"><PowerOff className="mr-1.5 h-4 w-4 text-muted-foreground" />Inactive: {formatDurationFromSeconds(inactiveDurationSeconds > 0 ? inactiveDurationSeconds : 0, true)}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.fill }} className="flex items-center">
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

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{chartTitlePrefix}Monthly Aggregation Chart</CardTitle>
          <CardDescription>No monthly aggregated data to display.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Please load and process data for monthly view.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChartBig className="h-6 w-6 text-primary" />
          <CardTitle>{chartTitlePrefix}Monthly Aggregated Data</CardTitle>
        </div>
        <CardDescription>
          Monthly total download and upload volumes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[70vh] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: chartData.length > 7 ? 50 : 5, 
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={true}
              tickMargin={10}
              angle={chartData.length > 7 ? -45 : 0}
              textAnchor={chartData.length > 7 ? "end" : "middle"}
              minTickGap={0}
              interval={chartData.length > 12 ? Math.floor(chartData.length / 10) : 0}
            />
            <YAxis 
                label={{ value: "Data (MB)", angle: -90, position: 'insideLeft', offset:10 }}
                tickFormatter={(value) => formatDataSizeForDisplay(value,0)}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}/>
            <RechartsLegend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
            <Bar
              dataKey="totalDownloadedMB"
              fill="var(--color-totalDownloadedMB)"
              radius={[4, 4, 0, 0]}
              name={chartConfig.totalDownloadedMB.label}
            />
            <Bar
              dataKey="totalUploadedMB"
              fill="var(--color-totalUploadedMB)"
              radius={[4, 4, 0, 0]}
              name={chartConfig.totalUploadedMB.label}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
