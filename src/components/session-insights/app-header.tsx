import { BarChart3 } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-6 border-b">
      <div className="container mx-auto flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Session Insights
        </h1>
      </div>
    </header>
  );
}
