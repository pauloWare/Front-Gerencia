import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./cadastro.css";
import tec from "../../assets/img/Teclogo.png";

export default function CadastroCliente() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    dataNascimento: '',
    fotoPerfilBase64: '',
    status: 'user' // Alinhado com o padrão do seu back-end
  });

  const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, fotoPerfilBase64: reader.result }));
    };
    reader.readAsDataURL(file);
    setFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('Enviando...');

    try {
      const API_URL = "http://localhost:8080/api/usuario";
      await axios.post(API_URL, formData);
      
      setStatusMessage("✅ Cadastro feito com sucesso!");
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setStatusMessage("❌ Erro ao cadastrar. Verifique o servidor.");
    }
  };

  return (
    <div className="cadastro-container">
      <form className="form-cadastro" onSubmit={handleSubmit}>
        <div className="cadastro-logo-overlap" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>
          <img src={tec} alt="Logo Academia" />
        </div>

        <h2 style={{color: 'white', textAlign: 'center', marginBottom: '10px'}}>Cadastro de Aluno</h2>

        <div className="form-group">
          <label>Nome completo</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Data de nascimento</label>
          <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Foto de perfil</label>
          <input type="file" id="foto" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
          <label htmlFor="foto" className="label-file-custom">
            {fileName === 'Nenhum arquivo selecionado' ? 'Selecionar Imagem' : 'Trocar Imagem'}
          </label>
          <span style={{ color: '#c084fc', fontSize: '12px', marginTop: '5px', display: 'block' }}>{fileName}</span>
        </div>

        <button type="submit" className="btn-cadastrar">Finalizar Cadastro</button>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
      </form>
    </div>
  );
}