"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  friendlyMessage: string;
  suggestion: string;
  isExplaining: boolean;
}

export class SmartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
      friendlyMessage: "",
      suggestion: "",
      isExplaining: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error?.message ?? String(error),
      friendlyMessage: "",
      suggestion: "",
    };
  }

  componentDidCatch(error: Error) {
    const msg = error?.message ?? String(error);
    // Immediately set a visible error message so we can diagnose
    this.setState({
      friendlyMessage: `Error: ${msg}`,
      suggestion: "Please take a screenshot of this message and report it.",
      isExplaining: false,
    });

    // Also try AI explanation
    fetch("/api/explain-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorMessage: error?.message ?? String(error),
        context: this.props.context ?? "Balatasan booking website",
      }),
    })
      .then(res => res.json())
      .then(data => {
        this.setState({
          friendlyMessage: data.friendlyMessage ?? "Something went wrong.",
          suggestion: data.suggestion ?? "Please try refreshing the page.",
          isExplaining: false,
        });
      })
      .catch(() => {
        this.setState({
          friendlyMessage: "Something unexpected happened while loading this page.",
          suggestion: "Please try refreshing the page.",
          isExplaining: false,
        });
      });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // Show real error in development
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2>Error: {this.state.errorMessage}</h2>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-headline">Oops, something went wrong</h2>
            <p className="text-slate-500 text-sm mt-1">Don't worry — your booking is safe.</p>
          </div>

          {/* AI explanation */}
          <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2">
            {this.state.isExplaining ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Figuring out what happened...</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-700 font-medium">
                  {this.state.friendlyMessage || "Something unexpected happened while loading this page."}
                </p>
                {this.state.suggestion && (
                  <p className="text-xs text-primary font-semibold">
                    💡 {this.state.suggestion}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Page
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Home className="h-4 w-4" /> Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
