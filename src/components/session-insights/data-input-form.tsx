"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <CardTitle>Input Session Data</CardTitle>
        </div>
        <CardDescription>
          Paste your raw session data below to begin analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Enter raw session data here (e.g., logs, usage reports)..."
            value={sessionData}
            onChange={(e) => setSessionData(e.target.value)}
            rows={10}
            className="min-h-[200px] text-sm"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !sessionData.trim()} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Data"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
