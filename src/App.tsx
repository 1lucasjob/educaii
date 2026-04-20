import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import RecuperarEmail from "./pages/RecuperarEmail";
import ResetPassword from "./pages/ResetPassword";
import AppLayout from "./layouts/AppLayout";
import Estudar from "./pages/Estudar";
import EstudarDemo from "./pages/EstudarDemo";
import Simulado from "./pages/Simulado";
import Normas from "./pages/Normas";
import Progresso from "./pages/Progresso";
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";
import Configuracoes from "./pages/Configuracoes";
import ChatProfessor from "./pages/ChatProfessor";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/recuperar-email" element={<RecuperarEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/estudar" replace />} />
              <Route path="estudar" element={<Estudar />} />
              <Route path="estudar-demo" element={<EstudarDemo />} />
              <Route path="simulado" element={<Simulado />} />
              <Route path="normas" element={<Normas />} />
              <Route path="progresso" element={<Progresso />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="admin" element={<Admin />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="chat" element={<ChatProfessor />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
