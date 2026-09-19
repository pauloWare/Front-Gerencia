import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { formatDate } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/format';
import {
  Plus, Save, X, Edit, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useRole } from '../../lib/useRole';
import { hasPermission } from '../../lib/permissions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';

const CARGOS = ['ADMIN', 'RECEPCIONISTA', 'FINANCEIRO', 'TECNICO'];
const SITUACOES = ['ATIVO', 'INATIVO', 'AFASTADO'];

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const estadoInicial = () => ({
  nome: '', cargo: '', telefone: '', salario: '', dataAdmissao: obterDataHoje(), situacao: 'ATIVO',
});

export default function Funcionarios() {
  const { role } = useRole();
  // Somente ADMIN e FINANCEIRO administram funcionários (a rota já é protegida,
  // mas esta flag garante que o botão "+ Novo Funcionário" só apareça para eles)
  const podeGerenciar = !role ? false : hasPermission(role, 'funcionarios');

  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [abrirFormulario, setAbrirFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});
  const [form, setForm] = useState(estadoInicial());

  useEffect(() => {
    buscarFuncionarios();
  }, []);

  const buscarFuncionarios = async () => {
    try {
      const response = await api.get('/funcionario');
      setFuncionarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      setErro('❌ Não foi possível carregar a lista de funcionários.');
    } finally {
      setLoading(false);
    }
  };

  const resetarFormulario = () => {
    setForm(estadoInicial());
    setEditando(null);
    setErros({});
  };

  const abrirNovo = () => {
    setErros({}); setErro(''); setSucesso('');
    resetarFormulario();
    setAbrirFormulario(true);
  };

  const abrirEditar = (func) => {
    setErros({}); setErro(''); setSucesso('');
    setForm({
      nome: func.nome || '',
      cargo: func.cargo || '',
      telefone: func.telefone || '',
      salario: func.salario != null ? func.salario : '',
      dataAdmissao: func.dataAdmissao || '',
      situacao: func.situacao || 'ATIVO',
    });
    setEditando(func);
    setAbrirFormulario(true);
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome completo.';
    if (!form.cargo) e.cargo = 'Selecione o cargo.';
    if (!form.dataAdmissao) e.dataAdmissao = 'Informe a data de admissão.';
    if (form.salario !== '' && Number(form.salario) <= 0) e.salario = 'O salário deve ser maior que zero.';
    return e;
  };

  const handleSalvar = async (ev) => {
    ev.preventDefault();
    setErro('');
    setSucesso('');
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        cargo: form.cargo,
        telefone: form.telefone ? form.telefone.trim() : '',
        salario: form.salario !== '' ? Number(form.salario) : null,
        dataAdmissao: form.dataAdmissao,
        situacao: form.situacao,
      };
      if (editando) {
        await api.put(`/funcionario/${editando.id}`, payload);
        setSucesso('Funcionário atualizado com sucesso.');
      } else {
        await api.post('/funcionario', payload);
        setSucesso('Funcionário cadastrado com sucesso.');
      }
      setAbrirFormulario(false);
      resetarFormulario();
      setErros({});
      await buscarFuncionarios();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      const msg = error.response?.data?.erro || error.response?.data?.error || 'Não foi possível salvar o funcionário.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este funcionário?')) {
      setErro('');
      setSucesso('');
      try {
        await api.delete(`/funcionario/${id}`);
        setFuncionarios(funcionarios.filter((f) => f.id !== id));
        setSucesso('Funcionário excluído com sucesso.');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir funcionário.';
        setErro(msg);
      }
    }
  };

  const filtered = funcionarios.filter((f) =>
    (f.nome && f.nome.toLowerCase().includes(search.toLowerCase())) ||
    (f.cargo && f.cargo.toLowerCase().includes(search.toLowerCase())) ||
    (f.telefone && f.telefone.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      {erro && (
        <div className="form-message error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="form-message success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={14} /> {sucesso}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="record-count">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Botão "+ Novo Funcionário" visível SOMENTE para ADMIN e FINANCEIRO */}
        {podeGerenciar && (
          <div className="toolbar-right">
            <button
              className="btn btn-primary btn-sm"
              onClick={abrirNovo}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Novo Funcionário
            </button>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Telefone</th>
              <th>Salário</th>
              <th>Admissão</th>
              <th>Status</th>
              <th style={{ width: 120 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">Nenhum funcionário encontrado</div>
                </td>
              </tr>
            ) : (
              filtered.map((func) => (
                <tr key={func.id}>
                  <td><strong>{func.nome}</strong></td>
                  <td>{func.cargo || '-'}</td>
                  <td>{func.telefone || '-'}</td>
                  <td><strong>{formatCurrency(func.salario)}</strong></td>
                  <td className="date-friendly">{formatDate(func.dataAdmissao) || '—'}</td>
                  <td>
                    <span className={`status-badge ${func.situacao === 'ATIVO' ? 'ATIVO' : 'INATIVO'}`}>
                      {func.situacao || 'INATIVO'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => abrirEditar(func)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit size={12} /> Editar
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDelete(func.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Formulário de Novo / Editar Funcionário (padrão visual do projeto) */}
      <Dialog
        open={abrirFormulario}
        onOpenChange={(open) => {
          if (!open) {
            setAbrirFormulario(false);
            resetarFormulario();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? (
                <><Edit size={18} /> Editar Funcionário</>
              ) : (
                <><Plus size={18} /> Novo Funcionário</>
              )}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? 'Atualize os dados do funcionário.'
                : 'Cadastre um novo colaborador da academia.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="dialog-form">
            <FormField label="Nome completo" required error={erros.nome}>
              <input
                className="theme-input"
                type="text"
                placeholder="Ex.: João da Silva"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </FormField>

            <FormField label="Cargo" required error={erros.cargo}>
              <select
                className="theme-select"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              >
                <option value="">Selecione o cargo</option>
                {CARGOS.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>

            <div className="form-grid-3">
              <FormField label="Telefone" error={erros.telefone}>
                <input
                  className="theme-input"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </FormField>
              <FormField label="Salário" error={erros.salario}>
                <input
                  className="theme-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="R$ 0,00"
                  value={form.salario}
                  onChange={(e) => setForm({ ...form, salario: e.target.value })}
                />
              </FormField>
              <FormField label="Admissão" required error={erros.dataAdmissao}>
                <input
                  className="theme-input"
                  type="date"
                  value={form.dataAdmissao}
                  onChange={(e) => setForm({ ...form, dataAdmissao: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Situação">
              <select
                className="theme-select"
                value={form.situacao}
                onChange={(e) => setForm({ ...form, situacao: e.target.value })}
              >
                {SITUACOES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          <DialogFooter className="dialog-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setAbrirFormulario(false); resetarFormulario(); }}
              disabled={salvando}
            >
              <X size={14} /> Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={salvando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} /> {salvando ? 'Salvando...' : (editando ? 'Atualizar' : 'Salvar')}
            </button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
