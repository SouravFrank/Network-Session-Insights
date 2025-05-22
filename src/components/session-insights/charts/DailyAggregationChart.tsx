
"use client";

import * as React from "react";
import type { RawDayAggregation } from "@/lib/session-utils/types";
import { formatDate, formatDataSizeForDisplay } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { BarChartBig, Download, Upload } from "lucide-react";

interface DailyAggregationChartProps {
  data: RawDayAggregation[];
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
  date: string; // Formatted date string for X-axis
  timestamp: number; // Original timestamp for sorting
  totalDownloadedMB: number;
  totalUploadedMB: number;
};

export function DailyAggregationChart({ data }: DailyAggregationChartProps) {
  const chartData = React.useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    return data
      .map((agg) => ({
        date: formatDate(agg.date),
        timestamp: agg.date.getTime(),
        totalDownloadedMB: parseFloat(agg.totalDownloadedMB.toFixed(2)),
        totalUploadedMB: parseFloat(agg.totalUploadedMB.toFixed(2)),
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending for chart
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Aggregation Chart</CardTitle>
          <CardDescription>No daily aggregated data to display.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Please load and process data for daily view.</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-3 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">Date: {label}</p>
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChartBig className="h-6 w-6 text-primary" />
          <CardTitle>Daily Aggregated Data</CardTitle>
        </div>
        <CardDescription>
          Daily total download and upload volumes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: chartData.length > 10 ? 50 : 5, // Increase bottom margin for angled labels
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={true}
              tickMargin={10}
              angle={chartData.length > 10 ? -45 : 0}
              textAnchor={chartData.length > 10 ? "end" : "middle"}
              minTickGap={0}
              interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0} // Adjust interval for readability
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
