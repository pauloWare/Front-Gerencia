import api from "../../service/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./prescricaoForm.css";

export default function Prescricao() {
  const { id } = useParams(); // id_cliente
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(id || "");
  const [prescricao, setPrescricao] = useState({
    dataCriacao: "",
    peso: "",
    altura: "",
    notes: "",
    metaPeso: "",
    metaAtividade: "",
    imc: "",
    recomendacaoMedica: ""
  });
  const [historico, setHistorico] = useState([]);
  const [isStaff, setIsStaff] = useState(false); // Simula autenticação; true para staff

  useEffect(() => {
    // Verifica se o usuário é admin para permitir edição
    const usuarioSalvo = localStorage.getItem("usuario");
    if (usuarioSalvo) {
      const parsed = JSON.parse(usuarioSalvo);
      if (parsed.status === "admin") {
        setIsStaff(true);
      }
    }

    // Carrega a lista de alunos
    api.get("/usuario")
      .then(res => {
        const filtrados = res.data.filter(u => u.status === "user" || u.status === "usuario");
        setAlunos(filtrados);
      })
      .catch(err => console.error("Erro ao carregar alunos:", err));
  }, []);

  useEffect(() => {
    if (!alunoSelecionadoId) return;

    const fetchData = async () => {
      try {
        const res = await api.get(`/prescricao/cliente/${alunoSelecionadoId}`)
        if (res.data && res.data.length > 0) {
          const data = res.data[0];
          const imc = data.peso && data.altura ? (data.peso / ((data.altura / 100) ** 2)).toFixed(1) : "";
          setPrescricao({ ...data, imc });
          setHistorico(res.data);
        } else {
          setPrescricao({
            dataCriacao: "",
            peso: "",
            altura: "",
            notes: "",
            metaPeso: "",
            metaAtividade: "",
            imc: "",
            recomendacaoMedica: ""
          });
          setHistorico([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchData();
  }, [alunoSelecionadoId]);

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
    if (!alunoSelecionadoId) {
      alert("Por favor, selecione um aluno!");
      return;
    }
    try {
      const endpoint = prescricao.id
  ? `/prescricao/${prescricao.id}`
  : `/prescricao`;
      const method = prescricao.id ? 'put' : 'post';

      await api[method](endpoint, { ...prescricao, usuario: { id: Number(alunoSelecionadoId) } });
      alert("Prescrição salva com sucesso!");
      navigate("/perfil");
    } catch (error) {
      console.error("Erro ao salvar prescrição:", error);
    }
  };

  return (
    <div className="container">
      <h2 className="form-title">Prescrição para Cliente ID: {alunoSelecionadoId || "Não selecionado"}</h2>
      <form onSubmit={handleSubmit} className="prescription-form">
        <div className="section">
          <h3 className="section-title">Detalhes Atuais</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="aluno_id">Aluno Selecionado:</label>
              <select
                id="aluno_id"
                className="input"
                value={alunoSelecionadoId}
                onChange={(e) => setAlunoSelecionadoId(e.target.value)}
                disabled={!isStaff}
                required
              >
                <option value="">-- Selecione um Aluno --</option>
                {alunos.map(aluno => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome} (ID: {aluno.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="data_criacao">Data de Criação:</label>
              <input id="dataCriacao" className="input" type="date" name="dataCriacao" value={prescricao.dataCriacao} onChange={handleChange} required disabled={!isStaff} />
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
              <input id="metaPeso" className="input" type="number" name="metaPeso" value={prescricao.metaPeso} onChange={handleChange} step="0.1" placeholder="Ex.: 75.0" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="meta_atividade">Meta de Atividade (min/semana):</label>
              <input id="metaAtividade" className="input" type="number" name="metaAtividade" value={prescricao.metaAtividade} onChange={handleChange} placeholder="Ex.: 150" disabled={!isStaff} />
            </div>
            <div className="form-group">
              <label htmlFor="recomendacao_medica">Recomendação Médica:</label>
              <textarea id="recomendacaoMedica" className="input" name="recomendacaoMedica" value={prescricao.recomendacaoMedica} onChange={handleChange} placeholder="Ex.: Consultar médico semanalmente" rows="4" disabled={!isStaff}></textarea>
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
                <p>Data: {hist.dataCriacao}, Peso: {hist.peso}kg, Altura: {hist.altura}cm, IMC: {(hist.peso && hist.altura ? (hist.peso / ((hist.altura / 100) ** 2)).toFixed(1) : "")}, Notas: {hist.notes || "Nenhuma"}</p>
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