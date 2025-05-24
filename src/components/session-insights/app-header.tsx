
"use client";

import { BarChart3, Share2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import React from "react";

export function AppHeader() {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    toast({
      title: "Generating Screenshot...",
      description: "Please wait while we capture the page.",
    });

    try {
      // Attempt to capture the entire documentElement
      const canvas = await html2canvas(document.documentElement, {
        useCORS: true, // Important if you have images from other domains
        allowTaint: true, // For CORS images, may be needed
        logging: false, // Disable html2canvas console logs for cleaner output
        // Ensure scrolling to the top is handled by html2canvas if possible,
        // or manage scroll position carefully if fixed elements are an issue.
        // html2canvas attempts to render the whole element, including off-screen parts.
        // Explicitly setting scrollX/Y in options can sometimes interfere.
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'session-insights-screenshot.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Screenshot Downloaded!",
        description: "The page has been saved as an image.",
      });
    } catch (error) {
      console.error("Error taking screenshot:", error);
      toast({
        variant: "destructive",
        title: "Screenshot Failed",
        description: typeof error === 'string' ? error : "Could not capture the page. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <header className="py-6 px-4 md:px-6 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Wishnet Session Insights
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-11">
            Welcome, Sourav Sadhukhan!
          </p>
        </div>
        <Button onClick={handleShare} variant="outline" size="icon" disabled={isSharing} title="Share Page Screenshot">
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          <span className="sr-only">Share Page</span>
        </Button>
      </div>
    </header>
  );
}
