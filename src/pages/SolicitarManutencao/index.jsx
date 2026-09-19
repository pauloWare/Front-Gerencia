import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { FormField } from '../../components/ui/field';
import { DateInput } from '../../components/ui/date-input';
import { TimeInput } from '../../components/ui/time-input';
import { UploadInput } from '../../components/ui/upload-input';
import { ClipboardList, Wrench, CalendarDays, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const obterDataHoje = () => {
  const h = new Date();
  return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
};

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const rotuloPrioridade = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };

export default function SolicitarManutencao() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erros, setErros] = useState({});
  const [form, setForm] = useState({
    equipamentoId: '',
    problema: '',
    prioridade: 'MEDIA',
    data: obterDataHoje(),
    hora: '',
    slaDias: '',
    fotoBase64: '',
  });
  const [previewImagem, setPreviewImagem] = useState('');

  useEffect(() => {
    carregarEquipamentos();
  }, []);

  const carregarEquipamentos = async () => {
    try {
      const response = await api.get('/manutencao/equipamentos');
      setEquipamentos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagemChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, fotoBase64: reader.result });
      setPreviewImagem(reader.result);
      setErro('');
    };
    reader.onerror = () => setErro('Erro ao ler o arquivo de imagem.');
    reader.readAsDataURL(file);
  };

  const removerImagem = () => {
    setForm({ ...form, fotoBase64: '' });
    setPreviewImagem('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    const novosErros = {};
    const equip = equipamentos.find(eq => eq.id === Number(form.equipamentoId));
    if (!equip) {
      novosErros.equipamentoId = 'Selecione o equipamento.';
    }
    if (!form.problema.trim()) {
      novosErros.problema = 'Descreva o problema do equipamento.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    setSalvando(true);
    try {
      await api.post('/manutencao/chamados', {
        equipamento: equip,
        problema: form.problema.trim(),
        prioridade: form.prioridade,
        data: form.data,
        hora: form.hora || null,
        slaDias: form.slaDias ? Number(form.slaDias) : null,
        status: 'ABERTO',
        tipo: 'CORRETIVA',
        fotoBase64: form.fotoBase64 || null,
      });
      setSucesso('Solicitação de manutenção enviada com sucesso!');
      setForm({
        equipamentoId: '',
        problema: '',
        prioridade: 'MEDIA',
        data: obterDataHoje(),
        hora: '',
        slaDias: '',
        fotoBase64: '',
      });
      setPreviewImagem('');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      setErro('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      {erro && (
        <div className="form-message error" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="form-message success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={16} /> {sucesso}
        </div>
      )}

      <div className="info-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="info-card-header">
          <ClipboardList size={18} /> Solicitar Manutenção
        </div>
        <p className="dialog-description" style={{ marginTop: 4 }}>
          Preencha os dados abaixo para enviar uma solicitação de manutenção para a equipe técnica.
        </p>

        <form onSubmit={handleSubmit} className="theme-form">
          {/* Equipamento */}
          <div className="form-section">
            <h3 className="section-title"><Wrench size={16} /> Informações do Equipamento</h3>
            <FormField label="Equipamento / Aparelho" required error={erros.equipamentoId}>
              <select
                className="theme-select"
                value={form.equipamentoId}
                onChange={(e) => setForm({ ...form, equipamentoId: e.target.value })}
              >
                <option value="">Selecione o equipamento</option>
                {equipamentos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nome} {eq.marca ? '- ' + eq.marca : ''} {eq.localizacao ? '(' + eq.localizacao + ')' : ''}</option>
                ))}
              </select>
            </FormField>

            <div className="form-grid-3">
              <FormField label="Data" required htmlFor="sm-data">
                <DateInput
                  id="sm-data"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </FormField>
              <FormField label="Horário" htmlFor="sm-hora">
                <TimeInput
                  id="sm-hora"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </FormField>
              <FormField label="Prioridade" required>
                <select
                  className="theme-select"
                  value={form.prioridade}
                  onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                >
                  {PRIORIDADES.map(pr => (
                    <option key={pr} value={pr}>{rotuloPrioridade[pr]}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Problema */}
          <div className="form-section">
            <h3 className="section-title"><ClipboardList size={16} /> Informações do Problema</h3>
            <FormField label="Descrição do Problema" required error={erros.problema}>
              <textarea
                className="theme-textarea"
                value={form.problema}
                onChange={(e) => setForm({ ...form, problema: e.target.value })}
                placeholder="Descreva detalhadamente o problema observado no equipamento..."
                rows={4}
              />
            </FormField>
          </div>

          {/* Anexo */}
          <div className="form-section">
            <h3 className="section-title"><ClipboardList size={16} /> Anexo</h3>
            <FormField
              label="Imagem do Equipamento (opcional)"
              hint="Ilustre o problema para facilitar o atendimento."
            >
              <UploadInput
                id="upload-imagem"
                onChange={handleImagemChange}
                preview={previewImagem}
                onRemove={removerImagem}
              />
            </FormField>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setForm({
                  equipamentoId: '',
                  problema: '',
                  prioridade: 'MEDIA',
                  data: obterDataHoje(),
                  hora: '',
                  slaDias: '',
                  fotoBase64: '',
                });
                setPreviewImagem('');
                setErro('');
                setSucesso('');
              }}
            >
              Limpar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={salvando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={14} /> {salvando ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
