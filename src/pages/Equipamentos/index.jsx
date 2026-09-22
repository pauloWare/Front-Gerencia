import { useState, useEffect, useRef } from 'react';
import api from '../../service/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { Plus, Save, X, AlertCircle } from 'lucide-react';

// ============================================================================
// RODADA 5 — Equipamentos: Tipo (ex.: "Esteira") x Identificação ("Esteira 04").
//
// - O ID primário continua sendo o identificador real (FKs intactas).
// - "nome" guarda a identificação da unidade ("Esteira 01"); o TIPO é derivado
//   no frontend removendo o sufixo numérico final (equips antigos preservados).
// - A próxima identificação é calculada no BACKEND
//   (GET /manutencao/equipamentos/proxima-identificacao?tipo=...).
// ============================================================================

/** Deriva o tipo a partir da identificação: "Esteira 01" -> "Esteira". */
const tipoDoEquipamento = (nome) => {
  const n = String(nome || '').trim();
  const m = n.match(/^(.*?)\s+0*\d+\s*$/);
  if (m && m[1].trim()) return m[1].trim();
  return n;
};

const formVazio = () => ({ nome: '', marca: '', localizacao: '', situacao: 'ATIVO' });

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [abrirNovo, setAbrirNovo] = useState(false);
  // RODADA 5: edição reaproveita o mesmo modal (preserva identificação/ID).
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(formVazio());
  // RODADA 5: tipo digitado + identificação gerada pelo backend (não editável).
  const [tipo, setTipo] = useState('');
  const [identificacao, setIdentificacao] = useState('');
  const [gerandoId, setGerandoId] = useState(false);
  const timerTipo = useRef(null);

  useEffect(() => {
    buscarEquipamentos();
    return () => clearTimeout(timerTipo.current);
  }, []);

  const buscarEquipamentos = async () => {
    try {
      const response = await api.get('/manutencao/equipamentos');
      setEquipamentos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fecharModal = () => {
    setAbrirNovo(false);
    setEditando(null);
    setForm(formVazio());
    setTipo('');
    setIdentificacao('');
    setGerandoId(false);
    setErro('');
    clearTimeout(timerTipo.current);
  };

  const abrirCriar = () => {
    setEditando(null);
    setForm(formVazio());
    setTipo('');
    setIdentificacao('');
    setErro('');
    setAbrirNovo(true);
  };

  // RODADA 5: edição — abre o mesmo modal, preserva identificação e ID.
  // Alterar o "tipo" aqui NÃO renomeia a unidade (evita quebrar histórico).
  const abrirEditar = (eq) => {
    setEditando(eq);
    setForm({ nome: eq.nome || '', marca: eq.marca || '', localizacao: eq.localizacao || '', situacao: eq.situacao || 'ATIVO' });
    setTipo(tipoDoEquipamento(eq.nome));
    setIdentificacao(eq.nome || '');
    setErro('');
    setAbrirNovo(true);
  };

  // RODADA 5: consulta o backend (debounce) para gerar a identificação.
  const gerarIdentificacao = async (valorTipo) => {
    const t = String(valorTipo || '').trim().replace(/\s+/g, ' ');
    if (!t) {
      setIdentificacao('');
      setGerandoId(false);
      return;
    }
    setGerandoId(true);
    try {
      const res = await api.get('/manutencao/equipamentos/proxima-identificacao', { params: { tipo: t } });
      setIdentificacao(res.data?.identificacao || '');
    } catch (error) {
      console.error('Erro ao gerar identificação:', error);
      setIdentificacao('');
    } finally {
      setGerandoId(false);
    }
  };

  const aoDigitarTipo = (valor) => {
    setTipo(valor);
    clearTimeout(timerTipo.current);
    timerTipo.current = setTimeout(() => gerarIdentificacao(valor), 400);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este equipamento?')) {
      try {
        await api.delete(`/manutencao/${id}`);
        buscarEquipamentos();
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  // RODADA 5: salvar cria (com identificação gerada) ou edita (preserva identificação).
  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!editando && !identificacao.trim()) {
      setErro(gerandoId ? 'Aguarde: gerando a identificação...' : 'Informe o tipo do equipamento para gerar a identificação.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      if (editando) {
        await api.put(`/manutencao/equipamentos/${editando.id}`, {
          nome: editando.nome, // identificação preservada (backend também reforça)
          marca: form.marca,
          localizacao: form.localizacao,
          situacao: form.situacao,
        });
      } else {
        await api.post('/manutencao/equipamentos', {
          nome: identificacao.trim(), // ex.: "Esteira 04" — calculada no backend
          marca: form.marca,
          localizacao: form.localizacao,
          situacao: form.situacao,
        });
      }
      fecharModal();
      await buscarEquipamentos();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      setErro(error.response?.data?.erro || 'Erro ao salvar o equipamento.');
    } finally {
      setSalvando(false);
    }
  };

  const filtered = equipamentos.filter(eq =>
    eq.nome.toLowerCase().includes(search.toLowerCase()) ||
    (eq.marca && eq.marca.toLowerCase().includes(search.toLowerCase())) ||
    (eq.localizacao && eq.localizacao.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <input type="text" placeholder="Buscar por nome, marca ou localização..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="record-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={abrirCriar} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Novo Equipamento
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Marca</th>
              <th>Localização</th>
              <th>Status</th>
              <th style={{ width: 140 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5"><div className="empty-state">Nenhum equipamento encontrado</div></td></tr>
            ) : (
              filtered.map(eq => (
                <tr key={eq.id}>
                  <td><strong>{eq.nome}</strong></td>
                  <td>{eq.marca || '-'}</td>
                  <td>{eq.localizacao || '-'}</td>
                  <td><span className={`status-badge ${eq.situacao === 'ATIVO' ? 'ATIVO' : 'INATIVO'}`}>{eq.situacao}</span></td>
                  <td>
                    <div className="actions">
                      <button onClick={() => abrirEditar(eq)} className="btn btn-secondary btn-xs">Editar</button>
                      <button onClick={() => handleDelete(eq.id)} className="btn btn-danger btn-xs">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={abrirNovo} onOpenChange={(open) => !open && setAbrirNovo(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <Plus size={18} /> {editando ? 'Editar Equipamento' : 'Novo Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? 'Altere marca, localização e situação. A identificação é preservada para manter o histórico.'
                : 'Informe o tipo do equipamento — a identificação é gerada automaticamente pelo sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="dialog-form">
            <FormField
              label={editando ? 'Tipo (fixo)' : 'Tipo/Nome'}
              required={!editando}
              hint={editando ? 'O tipo de um equipamento existente não muda para preservar o histórico de chamados.' : 'A identificação (ex.: Esteira 04) é gerada a partir do tipo.'}
            >
              <input
                className="theme-input"
                type="text"
                value={tipo}
                onChange={(e) => aoDigitarTipo(e.target.value)}
                disabled={!!editando}
                placeholder="Ex.: Esteira"
              />
            </FormField>
            <FormField label="Identificação" hint="Gerada automaticamente pelo sistema — não é editável.">
              <input
                className="theme-input"
                type="text"
                value={gerandoId && !editando ? 'Gerando...' : identificacao}
                disabled
                placeholder={editando ? '' : 'Ex.: Esteira 04'}
              />
            </FormField>
            <FormField label="Marca">
              <input className="theme-input" type="text" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ex.: Life Fitness" />
            </FormField>
            <FormField label="Localização">
              <input className="theme-input" type="text" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} placeholder="Ex.: Sala de cardio" />
            </FormField>
            <FormField label="Situação">
              <select className="theme-select" value={form.situacao} onChange={(e) => setForm({ ...form, situacao: e.target.value })}>
                <option value="ATIVO">Ativo</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </FormField>
            {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
            <DialogFooter className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setAbrirNovo(false)}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando || (gerandoId && !editando)}>
                <Save size={14} /> {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar equipamento'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
