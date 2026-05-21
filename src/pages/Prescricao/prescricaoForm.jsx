import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './prescricaoForm.css';

export default function PrescricaoForm() {
  const { id } = useParams(); // id_cliente
  const navigate = useNavigate();
  const [prescricao, setPrescricao] = useState({
    data_criacao: "",
    peso: "",
    altura: "",
    notes: "",
    meta_peso: "",
    meta_atividade: "",
    imc: "",
    recomendacao_medica: ""
  });
  const [historico, setHistorico] = useState([]);
  const [isStaff] = useState(false); // Simula autenticação; true para staff

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/prescricao/cliente/${id}`);
        if (res.data) {
          const data = res.data;
          const imc = data.peso && data.altura ? (data.peso / ((data.altura / 100) ** 2)).toFixed(1) : "";
          setPrescricao({ ...data, imc });
        }

        const histRes = await axios.get(`http://localhost:3000/prescricao/historico/${id}`);
        setHistorico(histRes.data || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedPrescricao = { ...prescricao, [name]: value };
    if (name === "peso" || name === "altura") {
      const imc = updatedPrescricao.peso && updatedPrescricao.altura
        ? (updatedPrescricao.peso / ((updatedPrescricao.altura / 100) ** 2)).toFixed(1)
        : "";
      setPrescricao({ ...updatedPrescricao, imc });
    } else {
      setPrescricao(updatedPrescricao);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStaff) {
      alert("Apenas o staff pode editar a prescrição!");
      return;
    }
    try {
      const endpoint = prescricao.id_prescricao
        ? `http://localhost:3000/prescricao/${prescricao.id_prescricao}`
        : `http://localhost:3000/prescricao`;
      const method = prescricao.id_prescricao ? 'put' : 'post';

      await axios[method](endpoint, { ...prescricao, id_cliente: id });
      alert("Prescrição salva com sucesso!");
      navigate("/cadastrados");
    } catch (error) {
      console.error("Erro ao salvar prescrição:", error);
    }
  };

  return (
    <div className="container">
      <h2 className="form-title">Prescrição para Cliente ID: {id}</h2>
      <form onSubmit={handleSubmit} className="prescription-form">
        <div className="section">
          <h3 className="section-title">Detalhes Atuais</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="data_criacao">Data de Criação:</label>
              <input id="data_criacao" className="input" type="date" name="data_criacao" value={prescricao.data_criacao} onChange={handleChange} required disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="peso">Peso (kg):</label>
              <input id="peso" className="input" type="number" name="peso" value={prescricao.peso} onChange={handleChange} step="0.1" placeholder="Ex.: 70.5" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="altura">Altura (cm):</label>
              <input id="altura" className="input" type="number" name="altura" value={prescricao.altura} onChange={handleChange} step="0.1" placeholder="Ex.: 175.5" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="imc">IMC:</label>
              <input id="imc" className="input" type="text" name="imc" value={prescricao.imc} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="meta_peso">Meta de Peso (kg):</label>
              <input id="meta_peso" className="input" type="number" name="meta_peso" value={prescricao.meta_peso} onChange={handleChange} step="0.1" placeholder="Ex.: 75.0" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="meta_atividade">Meta de Atividade (min/semana):</label>
              <input id="meta_atividade" className="input" type="number" name="meta_atividade" value={prescricao.meta_atividade} onChange={handleChange} placeholder="Ex.: 150" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="recomendacao_medica">Recomendação Médica:</label>
              <textarea id="recomendacao_medica" className="input" name="recomendacao_medica" value={prescricao.recomendacao_medica} onChange={handleChange} placeholder="Ex.: Consultar médico semanalmente" rows="4" disabled={!isStaff}></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Notas Gerais:</label>
              <textarea id="notes" className="input" name="notes" value={prescricao.notes} onChange={handleChange} placeholder="Ex.: Plano de treino semanal" rows="4" disabled={!isStaff}></textarea>
            </div>
          </div>
        </div>
        {historico.length > 0 && (
          <div className="section">
            <h3 className="section-title">Histórico de Prescrições</h3>
            {historico.map((hist, index) => (
              <div key={index} className="historical-entry">
                <p>Data: {hist.data_criacao}, Peso: {hist.peso}kg, Altura: {hist.altura}cm, IMC: {(hist.peso && hist.altura ? (hist.peso / ((hist.altura / 100) ** 2)).toFixed(1) : "")}, Notas: {hist.notes || "Nenhuma"}</p>
              </div>
            ))}
          </div>
        )}
        {isStaff ? (
          <button type="submit" className="button">Salvar Prescrição</button>
        ) : (
          <p className="info-text">Entre em contato com o staff para alterar sua prescrição.</p>
        )}
      </form>
    </div>
  );
}