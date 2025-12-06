import { useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { BarbershopContext } from "@/contexts/BarbershopContext";

/**
 * Hook para acessar o contexto da barbearia.
 * 
 * LÓGICA SIMPLIFICADA:
 * - Se está em rota /b/:slug → usa o BarbershopProvider (dados do slug da URL)
 * - Se está em rota global → retorna null (cada página global gerencia seu próprio contexto)
 */
export const useBarbershopContext = () => {
  const params = useParams<{ slug?: string }>();
  const location = useLocation();
  
  // Verificar se estamos dentro de um BarbershopProvider
  const contextValue = useContext(BarbershopContext);
  
  // Se estamos em uma rota /b/:slug, DEVE haver um BarbershopProvider
  const isInBarbershopRoute = location.pathname.startsWith("/b/");
  
  if (isInBarbershopRoute && contextValue) {
    // Usar dados do Provider (que vem do slug da URL)
    return {
      barbershop: contextValue.barbershop,
      isLoading: contextValue.isLoading,
      error: contextValue.error,
      baseUrl: contextValue.baseUrl
    };
  }
  
  // Para rotas globais, retornar null - cada página gerencia seu contexto
  return {
    barbershop: null,
    isLoading: false,
    error: null,
    baseUrl: ""
  };
};
