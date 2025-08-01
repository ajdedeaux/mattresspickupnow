import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerProfileProvider } from "@/contexts/CustomerProfileContext";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import { StoreLocatorPage } from "@/pages/store-locator";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/store-locator" component={StoreLocatorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CustomerProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
