import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function AnomalyAlertDisplay() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle>Anomaly Detection Alerts</CardTitle>
        </div>
        <CardDescription>
          Notifications for unusual data consumption patterns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This feature is under development. Future updates will include AI-powered anomaly detection to identify potential security breaches or system misuse.
        </p>
        {/* Example of how an alert might look (static for now) */}
        <div className="mt-4 p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <h4 className="font-semibold text-destructive">Example Alert: High Data Usage</h4>
          <p className="text-sm text-destructive/80">Unusually high data consumption detected on 2024-07-30 between 02:00 - 03:00 UTC. Further investigation recommended.</p>
        </div>
      </CardContent>
    </Card>
  );
}
