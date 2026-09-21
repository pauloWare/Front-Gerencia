import { Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login/index';
import Layout from './components/Layout';
import Home from './pages/Home/index';
import Assinaturas from './pages/Assinaturas/index';
import Dashboard from './pages/Dashboard/index';
import Alunos from './pages/Alunos/index';
import Cadastro from './pages/Cadastro/index';
import Mensalidades from './pages/Mensalidades/index';
import Presenca from './pages/Presenca/index';
import RegistrarPresenca from './pages/RegistrarPresenca/index';
import Funcionarios from './pages/Funcionarios/index';
import Equipamentos from './pages/Equipamentos/index';
import Manutencao from './pages/Manutencao/index';
import HistoricoChamados from './pages/HistoricoChamados/index';
import Financeiro from './pages/Financeiro/index';
import HistoricoFaturamento from './pages/HistoricoFaturamento/index';
import Relatorios from './pages/Relatorios/index';
import Perfil from './pages/Perfil/index';
import SolicitarManutencao from './pages/SolicitarManutencao/index';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';

export default function RotasApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar-presenca" element={<RegistrarPresenca />} />
      <Route path="/home" element={<Home />} />
      <Route path="/assinaturas" element={<Assinaturas />} />
      <Route path="/*" element={<Layout />}>
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
        <Route path="cadastro" element={<ProtectedRoute><Cadastro /></ProtectedRoute>} />
        <Route path="mensalidades" element={<ProtectedRoute><Mensalidades /></ProtectedRoute>} />
        <Route path="presenca" element={<ProtectedRoute><Presenca /></ProtectedRoute>} />
        <Route path="perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
        <Route path="equipamentos" element={<ProtectedRoute><Equipamentos /></ProtectedRoute>} />
        <Route path="manutencao" element={<ProtectedRoute><Manutencao /></ProtectedRoute>} />
        {/* Compatibilidade: /tickets é apenas um alias da rota canônica /manutencao
            (o módulo de permissão continua sendo "manutencao"). */}
        <Route path="tickets" element={<Navigate to="/manutencao" replace />} />
        <Route path="historico-chamados" element={<ProtectedRoute><HistoricoChamados /></ProtectedRoute>} />
        <Route path="solicitar-manutencao" element={<ProtectedRoute><SolicitarManutencao /></ProtectedRoute>} />
        <Route path="financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
        <Route path="historico-faturamento" element={<ProtectedRoute><HistoricoFaturamento /></ProtectedRoute>} />
        <Route path="relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
