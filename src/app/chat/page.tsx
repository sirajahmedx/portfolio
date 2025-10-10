"use client";

import { Suspense } from "react";
import Chat from "@/components/chat/chat";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Suspense fallback={<div>Loading chat...</div>}>
          <Chat />
        </Suspense>
      </div>
    </div>
  );
}
