"use client";

import { Suspense } from "react";
import Chat from "@/components/chat/chat";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
              </div>
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </div>
        }
      >
        <Chat />
      </Suspense>
    </div>
  );
}
