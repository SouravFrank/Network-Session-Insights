
import type { AnalyzeSessionInsightsOutput } from "@/ai/flows/analyze-session-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Activity, TrendingUp, CalendarDays, CalendarRange, Calendar as CalendarIconLucide, Users, BarChartBig, Bot } from "lucide-react";

interface SessionInsightsDisplayProps {
  data: AnalyzeSessionInsightsOutput;
}

export function SessionInsightsDisplay({ data }: SessionInsightsDisplayProps) {
  return (
    <Card className="shadow-lg border-primary/30 bg-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">AI-Powered Session Analysis</CardTitle>
        </div>
        <CardDescription>
          Key insights and summaries derived from your session data by our AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <Accordion type="multiple" defaultValue={["item-patterns", "item-session"]} className="w-full">
          <AccordionItem value="item-patterns">
            <AccordionTrigger className="text-lg hover:no-underline">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary/80" />
                Overall Usage Patterns
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Peak Hours:</h4>
                <p className="text-foreground/90 bg-muted/30 p-2 rounded-md">{data.peakHours || "Not identified"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Quiet Hours:</h4>
                <p className="text-foreground/90 bg-muted/30 p-2 rounded-md">{data.quietHours || "Not identified"}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-session">
            <AccordionTrigger className="text-lg hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary/80" />
                Session-Level Insights
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-sm text-foreground/90 bg-muted/30 p-3 rounded-md leading-relaxed">
              {data.sessionLevelSummary || "No specific session-level insights generated."}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-daily">
            <AccordionTrigger className="text-lg hover:no-underline">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary/80" />
                Daily Insights
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-sm text-foreground/90 bg-muted/30 p-3 rounded-md leading-relaxed">
              {data.dailyLevelSummary || "No specific daily insights generated."}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-weekly">
            <AccordionTrigger className="text-lg hover:no-underline">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary/80" />
                Weekly Insights
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-sm text-foreground/90 bg-muted/30 p-3 rounded-md leading-relaxed">
              {data.weeklyLevelSummary || "No specific weekly insights generated."}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-monthly">
            <AccordionTrigger className="text-lg hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChartBig className="h-5 w-5 text-primary/80" /> {/* Changed from CalendarIconLucide for variety */}
                Monthly Insights
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-sm text-foreground/90 bg-muted/30 p-3 rounded-md leading-relaxed">
              {data.monthlyLevelSummary || "No specific monthly insights generated."}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
