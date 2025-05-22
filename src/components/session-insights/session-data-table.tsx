
"use client";

import type { SessionData } from "@/lib/session-utils/types";
import { parseLoginTime, parseSessionDurationToSeconds } from "@/lib/session-utils/parsers";
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
import { ListChecks } from "lucide-react";

interface SessionDataTableProps {
  sessions: SessionData[];
}

export function SessionDataTable({ sessions }: SessionDataTableProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No session data to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          <CardTitle>Individual Sessions</CardTitle>
        </div>
        <CardDescription>
          Detailed log of individual user sessions, sorted by most recent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of user sessions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Login Time</TableHead>
              <TableHead>Session Duration</TableHead>
              <TableHead className="text-right">Download</TableHead>
              <TableHead className="text-right">Upload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => {
              let loginDate: Date;
              let durationSeconds: number;
              try {
                loginDate = parseLoginTime(session.loginTime);
                durationSeconds = parseSessionDurationToSeconds(session.sessionTime);
              } catch (e) {
                // Fallback for invalid data that might have slipped through
                // Should ideally not happen if initial parsing is robust
                return (
                  <TableRow key={`error-${index}`}>
                    <TableCell colSpan={4} className="text-destructive">
                      Error parsing session data: {session.loginTime}
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={`${session.loginTime}-${index}`}>
                  <TableCell className="font-medium">
                    {formatDate(loginDate)} {loginDate.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{formatDurationFromSeconds(durationSeconds, true)}</TableCell>
                  <TableCell className="text-right">{formatDataSizeForDisplay(session.download, 1)}</TableCell>
                  <TableCell className="text-right">{formatDataSizeForDisplay(session.upload, 1)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
