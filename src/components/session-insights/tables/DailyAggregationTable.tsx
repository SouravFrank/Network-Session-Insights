
"use client";

import type { RawDayAggregation } from "@/lib/session-utils/types";
import { formatDate, formatDurationFromSeconds, formatDataSizeForDisplay } from "@/lib/session-utils/formatters";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

interface DailyAggregationTableProps {
  data: RawDayAggregation[];
}

export function DailyAggregationTable({ data }: DailyAggregationTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <CardTitle>Daily Aggregated Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No daily aggregated data to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <CardTitle>Daily Aggregated Data</CardTitle>
        </div>
        <CardDescription>
          Summary of session data aggregated by day, sorted by most recent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of daily aggregated session data.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead>Total Duration</TableHead>
              <TableHead className="text-right">Total Downloaded</TableHead>
              <TableHead className="text-right">Total Uploaded</TableHead>
              <TableHead className="text-center">Session Segments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((agg, index) => (
              <TableRow key={`daily-agg-${agg.date.toISOString()}-${index}`}>
                <TableCell className="font-medium">
                  {formatDate(agg.date)}
                </TableCell>
                <TableCell>{formatDurationFromSeconds(agg.totalDurationSeconds, true)}</TableCell>
                <TableCell className="text-right">{formatDataSizeForDisplay(agg.totalDownloadedMB, 1)}</TableCell>
                <TableCell className="text-right">{formatDataSizeForDisplay(agg.totalUploadedMB, 1)}</TableCell>
                <TableCell className="text-center">{agg.sessionCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
