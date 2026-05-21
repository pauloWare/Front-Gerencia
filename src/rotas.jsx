import { useEffect } from "react";
import { useLocation, Routes, Route } from "react-router-dom";

import Header from './pages/Header/header';
import Link_Home from './pages/Home/home';
import Link_login from './pages/Login/index';
import Link_Cadastro from "./pages/ClienteCadastro/cadastro";
import Link_Perfil from './pages/Perfil/PerfilUsuario';
import Link_Assinatura from './pages/Assinaturas/assinaturas';
import PrescricaoForm from './pages/Prescricao/prescricaoForm'; 
import Link_Categoria from './pages/Categoria/categoria';


export default function Layout() {
  const location = useLocation();
  const showHeader = location.pathname !== '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Link_login />} />
        <Route path="/home" element={<Link_Home />} />
        <Route path="/login" element={<Link_login />} />
        <Route path="/cadastro" element={<Link_Cadastro />} />
        <Route path="/perfil" element={<Link_Perfil />} />
        <Route path="/categoria" element={<Link_Categoria />} />
        <Route path="/assinaturas" element={<Link_Assinatura />} />
        <Route path="/prescricao/:id" element={<PrescricaoForm />} /> 
      </Routes>
    </>
  );
}