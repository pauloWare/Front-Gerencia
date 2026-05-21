import React, { useState } from "react";
import api from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";
import tec from "../../assets/img/Teclogo.png";

const Link_login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get(`http://localhost:8080/api/usuario?email=${email.trim()}&senha=${senha.trim()}`);
      const data = response.data;

      if (data && data.length > 0) {
        setMessage("✅ Login realizado!");
        // Salvamos apenas o primeiro objeto da lista retornada
        localStorage.setItem("usuario", JSON.stringify(data[0]));
        navigate("/home");
      } else {
        setMessage("❌ Email ou senha inválidos.");
      }
    } catch (error) {
      setMessage("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="login-container">
      <form className="form-login" onSubmit={handleLogin}>
        <div className="login-logo-overlap" onClick={() => navigate("/home")}>
          <img src={tec} alt="Logo" />
        </div>
        <h1>Login Academia</h1>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        <button type="submit" className="btn-entrar">Entrar</button>
        {message && <p className="login-message">{message}</p>}
        <p className="signup-text">
          Não tem login? <span onClick={() => navigate("/cadastro")}>Cadastre-se aqui</span>
        </p>
      </form>
    </div>
  );
};
export default Link_login;