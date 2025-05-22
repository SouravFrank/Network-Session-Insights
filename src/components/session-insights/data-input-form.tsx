
"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileJson } from "lucide-react"; // Changed icon to FileJson

interface DataInputFormProps {
  onSubmit: (sessionData: string) => void;
  isLoading: boolean;
}

export function DataInputForm({ onSubmit, isLoading }: DataInputFormProps) {
  const [sessionData, setSessionData] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(sessionData);
  };

  const placeholderJson = `[
  {
    "loginTime": "01-08-2024 10:00:00",
    "sessionTime": "01:30:00",
    "download": 150.5,
    "upload": 75.2
  },
  {
    "loginTime": "01-08-2024 23:30:00",
    "sessionTime": "02:15:00",
    "download": 220.0,
    "upload": 95.8
  }
]`;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileJson className="h-6 w-6 text-primary" />
          <CardTitle>Input Session Data (JSON)</CardTitle>
        </div>
        <CardDescription>
          Paste your session data as a JSON array below. Each object in the array
          should represent a session with the following fields:
          <ul className="list-disc list-inside text-xs mt-1 pl-2">
            <li><code className="text-xs">loginTime</code>: string (format: "DD-MM-YYYY HH:MM:SS")</li>
            <li><code className="text-xs">sessionTime</code>: string (format: "HH:MM:SS")</li>
            <li><code className="text-xs">download</code>: number (in MB)</li>
            <li><code className="text-xs">upload</code>: number (in MB)</li>
          </ul>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={placeholderJson}
            value={sessionData}
            onChange={(e) => setSessionData(e.target.value)}
            rows={10}
            className="min-h-[200px] text-sm font-mono" // Added font-mono for better JSON readability
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !sessionData.trim()} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Load Data"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

