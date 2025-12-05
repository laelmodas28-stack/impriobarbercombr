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

const App = () => (
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
);

export default App;
