
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Legend as RechartsLegend } from "recharts";
import { TrendingUp, Info } from "lucide-react";

interface SessionDataGraphProps {
  rawData: string | null;
}

type ParsedDataItem = {
  date: Date;
  value: number;
};

type ChartDataItem = {
  time: string;
  value: number;
  originalDate: Date; // For sorting
};

const chartConfig = {
  value: {
    label: "Metric Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function SessionDataGraph({ rawData }: SessionDataGraphProps) {
  const [granularity, setGranularity] = React.useState<"hourly" | "daily">("hourly");

  const parsedData = React.useMemo((): ParsedDataItem[] => {
    if (!rawData || !rawData.trim()) return [];
    try {
      return rawData
        .split("\n")
        .map((line) => {
          const [timestamp, valStr] = line.split(",");
          if (!timestamp || !valStr) return null;
          const date = new Date(timestamp.trim());
          const value = parseFloat(valStr.trim());
          if (isNaN(date.getTime()) || isNaN(value)) return null;
          return { date, value };
        })
        .filter((item): item is ParsedDataItem => item !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error("Error parsing session data:", error);
      return [];
    }
  }, [rawData]);

  const displayData = React.useMemo((): ChartDataItem[] => {
    if (!parsedData.length) return [];

    if (granularity === "hourly") {
      const hourlyMap = new Map<string, { sum: number; count: number; dateObj: Date }>();
      parsedData.forEach(({ date, value }) => {
        const hourKey = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours()
        ).toISOString();

        if (!hourlyMap.has(hourKey)) {
          hourlyMap.set(hourKey, { sum: 0, count: 0, dateObj: new Date(hourKey) });
        }
        const current = hourlyMap.get(hourKey)!;
        current.sum += value;
        current.count += 1;
      });
      return Array.from(hourlyMap.values())
        .map(({ sum, count, dateObj }) => ({
          time: dateObj.toLocaleTimeString(undefined, {month: 'short', day: 'numeric', hour: "2-digit" }),
          value: sum / count, // Average for the hour
          originalDate: dateObj,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
    } else { // Daily
      const dailyMap = new Map<string, { sum: number; count: number; dateObj: Date }>();
      parsedData.forEach(({ date, value }) => {
        const dayKey = date.toISOString().split("T")[0];
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, { sum: 0, count: 0, dateObj: new Date(dayKey) });
        }
        const current = dailyMap.get(dayKey)!;
        current.sum += value;
        current.count += 1;
      });
      return Array.from(dailyMap.values())
        .map(({ sum, count, dateObj }) => ({
          time: dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          value: sum / count, // Average for the day
          originalDate: dateObj,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
    }
  }, [parsedData, granularity]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle>Session Data Trend</CardTitle>
            </div>
            <div className="flex gap-2">
            <Button
              variant={granularity === "hourly" ? "default" : "outline"}
              size="sm"
              onClick={() => setGranularity("hourly")}
            >
              Hourly
            </Button>
            <Button
              variant={granularity === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setGranularity("daily")}
            >
              Daily
            </Button>
          </div>
        </div>
        <CardDescription>
          Visual representation of your session data. Expected format: one 'timestamp,value' per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <LineChart
              accessibilityLayer
              data={displayData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // tickFormatter={(value) => value.slice(0, 3)} // Example for abbreviation if needed
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // domain={['dataMin - 5', 'dataMax + 5']} // Optional: to add padding
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <RechartsLegend content={<ChartLegend />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
                name="Metric Value"
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4 border-2 border-dashed rounded-lg">
            <Info className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No data to display.</p>
            <p className="text-sm text-muted-foreground">
              Please input session data in the format `ISO_timestamp,numeric_value` per line.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Example: <code>2024-01-01T10:00:00Z,50</code></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
