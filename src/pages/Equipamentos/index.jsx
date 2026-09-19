import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { Plus, Save, X, AlertCircle } from 'lucide-react';

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [abrirNovo, setAbrirNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ nome: '', marca: '', localizacao: '', situacao: 'ATIVO' });
  const navigate = useNavigate();

  useEffect(() => {
    buscarEquipamentos();
  }, []);

  const buscarEquipamentos = async () => {
    try {
      const response = await api.get('/manutencao');
      setEquipamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } finally {
      setLoading(false);
    }
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

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErro('Informe o nome do equipamento.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await api.post('/manutencao/equipamentos', {
        nome: form.nome,
        marca: form.marca,
        localizacao: form.localizacao,
        situacao: form.situacao,
      });
      setAbrirNovo(false);
      setForm({ nome: '', marca: '', localizacao: '', situacao: 'ATIVO' });
      await buscarEquipamentos();
    } catch (error) {
      console.error('Erro ao criar equipamento:', error);
      setErro('❌ Erro ao criar o equipamento.');
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
          <button className="btn btn-primary btn-sm" onClick={() => { setAbrirNovo(true); setErro(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <th style={{ width: 100 }}>Ações</th>
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
              <Plus size={18} /> Novo Equipamento
            </DialogTitle>
            <DialogDescription>Cadastre um novo equipamento para controle de manutenção.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCriar} className="dialog-form">
            <FormField label="Nome" required>
              <input className="theme-input" type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Esteira 01" />
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
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar equipamento'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
