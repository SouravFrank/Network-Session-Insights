
"use client";

import * as React from "react";
import type { RawMonthAggregation } from "@/lib/session-utils/types";
import { formatDataSizeForDisplay } from "@/lib/session-utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"; // Changed Line to Bar
import { BarChartBig, Download, Upload } from "lucide-react"; // Changed icon

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
  monthLabel: string; // "Mon YYYY" e.g. "Nov 2024"
  timestamp: number; // Start date timestamp for sorting
  totalDownloadedMB: number;
  totalUploadedMB: number;
};

export function MonthlyAggregationChart({ data, chartTitlePrefix = "" }: MonthlyAggregationChartProps) {
  const chartData = React.useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    return data
      .map((agg) => ({
        monthLabel: `${agg.monthName.substring(0,3)} ${agg.year}`,
        timestamp: agg.startDate.getTime(),
        totalDownloadedMB: parseFloat(agg.totalDownloadedMB.toFixed(2)),
        totalUploadedMB: parseFloat(agg.totalUploadedMB.toFixed(2)),
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending for chart
  }, [data]);

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
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const originalPoint = data.find(d => `${d.monthName.substring(0,3)} ${d.year}` === label);
      const monthDisplay = originalPoint ? `${originalPoint.monthName} ${originalPoint.year}` : label;

      return (
        <div className="bg-background border p-3 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">Month: {monthDisplay}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.fill }} className="flex items-center"> {/* Changed pld.stroke to pld.fill for Bar */}
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
          <BarChartBig className="h-6 w-6 text-primary" /> {/* Changed icon */}
          <CardTitle>{chartTitlePrefix}Monthly Aggregated Data</CardTitle> {/* Changed title wording */}
        </div>
        <CardDescription>
          Monthly total download and upload volumes. {/* Changed description wording */}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <BarChart // Changed from LineChart to BarChart
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
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}/> {/* Changed cursor for bar chart */}
            <RechartsLegend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}} />
            <Bar // Changed from Line to Bar
              dataKey="totalDownloadedMB"
              fill="var(--color-totalDownloadedMB)" // Used fill instead of stroke
              radius={[4, 4, 0, 0]} // Bar specific prop
              name={chartConfig.totalDownloadedMB.label}
            />
            <Bar // Changed from Line to Bar
              dataKey="totalUploadedMB"
              fill="var(--color-totalUploadedMB)" // Used fill instead of stroke
              radius={[4, 4, 0, 0]} // Bar specific prop
              name={chartConfig.totalUploadedMB.label}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
