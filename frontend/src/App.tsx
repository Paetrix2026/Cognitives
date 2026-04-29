import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { useLiveUpdates } from "@/hooks/use-live-updates";
import NotFound from "@/pages/not-found";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import Official from "./pages/official";
import Contractor from "./pages/contractor";
import Auditor from "./pages/auditor";
import Inspector from "./pages/inspector";
import ProjectDetail from "./pages/project-detail";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/citizen">
        <Layout><Citizen /></Layout>
      </Route>
      <Route path="/official">
        <Layout><Official /></Layout>
      </Route>
      <Route path="/contractor">
        <Layout><Contractor /></Layout>
      </Route>
      <Route path="/auditor">
        <Layout><Auditor /></Layout>
      </Route>
      <Route path="/inspector">
        <Layout><Inspector /></Layout>
      </Route>
      <Route path="/admin">
        <Layout><Admin /></Layout>
      </Route>
      <Route path="/projects/:id">
        {params => (
          <Layout><ProjectDetail id={params.id} /></Layout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function RealtimeBridge() {
  useLiveUpdates();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <RealtimeBridge />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
