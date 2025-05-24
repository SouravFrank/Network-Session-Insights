
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Zap, Eye } from "lucide-react";

export function AnomalyAlertDisplay() {
  return (
    <Card className="shadow-lg border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-500" />
          <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">Anomaly Detection Alerts</CardTitle>
        </div>
        <CardDescription className="text-amber-600 dark:text-amber-500">
          AI-powered insights into unusual data consumption patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-800/30 border border-amber-300 dark:border-amber-600">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <h4 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Feature Under Development</h4>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-500 leading-relaxed">
            Our AI is learning to spot unusual activity! Soon, this section will highlight potential security concerns or system misuse by automatically detecting anomalies in your session data.
          </p>
          <p className="text-xs text-amber-500 dark:text-amber-600 mt-3 italic">
            Stay tuned for intelligent alerts!
          </p>
        </div>

        {/* Example of how an alert might look (static for now) */}
        <div className="mt-4 p-3 border border-destructive/30 rounded-md bg-destructive/5 dark:bg-destructive/10 opacity-70">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-destructive/80" />
            <h4 className="font-semibold text-destructive/90 text-sm">Example Future Alert (Illustrative)</h4>
          </div>
          <p className="text-xs text-destructive/70 mt-1">
            High data consumption (350% above average) detected on 2024-07-30 between 02:00 - 03:00 UTC by UserXYZ.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
