
"use client";

import * as React from "react";
import type { RawDayAggregation } from "@/lib/session-utils/types";
import { formatDate, formatDataSizeForDisplay } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"; // Changed Bar to Line
import { TrendingUp, Download, Upload } from "lucide-react"; // Changed icon

interface DailyAggregationChartProps {
  data: RawDayAggregation[];
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
  date: string; // Formatted date string for X-axis
  timestamp: number; // Original timestamp for sorting
  totalDownloadedMB: number;
  totalUploadedMB: number;
};

export function DailyAggregationChart({ data, chartTitlePrefix = "" }: DailyAggregationChartProps) {
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
          <CardTitle>{chartTitlePrefix}Daily Aggregation Chart</CardTitle>
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
            <p key={pld.dataKey} style={{ color: pld.stroke }} className="flex items-center"> {/* Changed pld.fill to pld.stroke for Line */}
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
          <TrendingUp className="h-6 w-6 text-primary" /> {/* Changed icon */}
          <CardTitle>{chartTitlePrefix}Daily Aggregated Data Trends</CardTitle> {/* Changed title wording */}
        </div>
        <CardDescription>
          Daily total download and upload volume trends. {/* Changed description wording */}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <LineChart // Changed from BarChart to LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: chartData.length > 10 ? 50 : 5, 
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
              interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0} 
            />
            <YAxis 
                label={{ value: "Data (MB)", angle: -90, position: 'insideLeft', offset:10 }}
                tickFormatter={(value) => formatDataSizeForDisplay(value,0)}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }}/> {/* Changed cursor for line chart */}
            <RechartsLegend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
            <Line // Changed from Bar to Line
              type="monotone"
              dataKey="totalDownloadedMB"
              stroke="var(--color-totalDownloadedMB)" // Used stroke instead of fill
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={chartConfig.totalDownloadedMB.label}
            />
            <Line // Changed from Line to Line
              type="monotone"
              dataKey="totalUploadedMB"
              stroke="var(--color-totalUploadedMB)" // Used stroke instead of fill
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
