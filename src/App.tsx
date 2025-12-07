import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BarbershopProvider } from "@/contexts/BarbershopContext";
import BarbershopLayout from "@/components/BarbershopLayout";
import Splash from "./pages/Splash";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Professionals from "./pages/Professionals";
import ProfessionalDetail from "./pages/ProfessionalDetail";
import Booking from "./pages/Booking";
import Account from "./pages/Account";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Gallery from "./pages/Gallery";
import Subscriptions from "./pages/Subscriptions";
import RegisterBarbershop from "./pages/RegisterBarbershop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Error Boundary para capturar erros não tratados
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-4">Algo deu errado</h1>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas com slug da barbearia */}
              <Route path="/b/:slug" element={<BarbershopLayout />}>
                <Route index element={<Home />} />
                <Route path="services" element={<Services />} />
                <Route path="professionals" element={<Professionals />} />
                <Route path="professionals/:id" element={<ProfessionalDetail />} />
                <Route path="booking" element={<Booking />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="about" element={<About />} />
              </Route>

              {/* Rotas padrão (compatibilidade) */}
              <Route path="/splash" element={<Splash />} />
              <Route path="/" element={<BarbershopProvider><Home /></BarbershopProvider>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/services" element={<BarbershopProvider><Services /></BarbershopProvider>} />
              <Route path="/professionals" element={<BarbershopProvider><Professionals /></BarbershopProvider>} />
              <Route path="/professionals/:id" element={<BarbershopProvider><ProfessionalDetail /></BarbershopProvider>} />
              <Route path="/booking" element={<BarbershopProvider><Booking /></BarbershopProvider>} />
              <Route path="/account" element={<Account />} />
              <Route path="/about" element={<BarbershopProvider><About /></BarbershopProvider>} />
              <Route path="/gallery" element={<BarbershopProvider><Gallery /></BarbershopProvider>} />
              <Route path="/subscriptions" element={<BarbershopProvider><Subscriptions /></BarbershopProvider>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/registro-barbeiro" element={<RegisterBarbershop />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
