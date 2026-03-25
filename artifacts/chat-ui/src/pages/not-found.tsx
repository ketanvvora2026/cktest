import React from "react";
import { Link } from "wouter";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto ring-8 ring-destructive/5">
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The page you are looking for doesn't exist or has been moved. Let's get you back to the chat.
          </p>
        </div>

        <Link href="/" className="inline-block mt-4">
          <Button size="lg" className="rounded-xl px-8 gap-2">
            <Home size={18} />
            Back to Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
