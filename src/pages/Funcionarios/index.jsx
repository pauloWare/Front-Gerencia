import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import api from '../../service/api';
import { formatDate } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/format';
import {
  Plus, Save, X, Edit, Trash2, AlertCircle, CheckCircle2,
  Eye, User, Briefcase, MapPin, ShieldCheck, KeyRound,
} from 'lucide-react';
import { useRole } from '../../lib/useRole';
import { hasPermission } from '../../lib/permissions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { DateInput } from '../../components/ui/date-input';
import { MoneyInput } from '../../components/ui/money-input';

// ============================================================================
// Cargos e situações do sistema. Os cargos são fixos: não é possível criar
// cargos/permissões novas, e é o cargo que define o acesso (lib/permissions.js).
// ============================================================================
const CARGOS = ['ADMIN', 'RECEPCIONISTA', 'FINANCEIRO', 'TECNICO'];
const SITUACOES = ['ATIVO', 'INATIVO', 'AFASTADO'];
const SENHA_MINIMA = 6;

// =========================== FORMATAÇÃO =====================================

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const somenteDigitos = (valor) => String(valor || '').replace(/\D/g, '');

const formatarTelefone = (valor) => {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatarCpf = (valor) => {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatarCep = (valor) => {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};



const emailValido = (valor) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(valor || '').trim());

/** Mesma regra de validação de CPF aplicada no backend (digitos verificadores). */
const cpfValido = (valor) => {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(d[i]) * (10 - i);
  let resto = soma % 11;
  const primeiro = resto < 2 ? 0 : 11 - resto;
  if (primeiro !== Number(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(d[i]) * (11 - i);
  resto = soma % 11;
  const segundo = resto < 2 ? 0 : 11 - resto;
  return segundo === Number(d[10]);
};

const exibir = (valor) => (valor === null || valor === undefined || String(valor).trim() === '' ? '—' : valor);

/** Funcionário com conta de acesso ao sistema (vinculada pelo backend). */
const temContaAcesso = (func) => Boolean(func?.usuarioId);

const estadoInicial = () => ({
  // Dados pessoais
  nome: '', cpf: '', dataNascimento: '', telefone: '', email: '',
  // Dados profissionais
  cargo: '', salario: '', dataAdmissao: obterDataHoje(), situacao: 'ATIVO',
  // Endereço
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  // Acesso ao sistema
  emailAcesso: '', senha: '', confirmarSenha: '',
});

/** Linha de detalhe (usa o padrão .info-row do tema). */
const LinhaDetalhe = ({ label, valor }) => (
  <div className="info-row" style={{ gap: 16, alignItems: 'flex-start' }}>
    <span className="label">{label}</span>
    <span className="value" style={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{exibir(valor)}</span>
  </div>
);

LinhaDetalhe.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default function Funcionarios() {
  const { role } = useRole();
  // Somente ADMIN e FINANCEIRO administram funcionários (a rota já é protegida,
  // mas esta flag garante que as ações só apareçam para eles)
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
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  // Guarda o último CEP consultado: evita repetir a requisição (onChange + onBlur)
  const ultimoCepBuscado = useRef('');

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
    setAlterarSenha(false);
    setBuscandoCep(false);
    ultimoCepBuscado.current = '';
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
      cpf: formatarCpf(func.cpf || ''),
      dataNascimento: func.dataNascimento || '',
      telefone: formatarTelefone(func.telefone || ''),
      email: func.email || '',
      cargo: func.cargo || '',
      salario: func.salario != null ? func.salario : '',
      dataAdmissao: func.dataAdmissao || '',
      situacao: func.situacao || 'ATIVO',
      cep: formatarCep(func.cep || ''),
      logradouro: func.logradouro || '',
      numero: func.numero || '',
      complemento: func.complemento || '',
      bairro: func.bairro || '',
      cidade: func.cidade || '',
      estado: func.estado || '',
      emailAcesso: func.emailAcesso || '',
      senha: '',              // a senha atual nunca é enviada ao front-end
      confirmarSenha: '',
    });
    setAlterarSenha(false);
    setBuscandoCep(false);
    ultimoCepBuscado.current = '';
    setEditando(func);
    setAbrirFormulario(true);
  };

  // Validação dos campos no front-end (o backend valida novamente).
  const validar = () => {
    const e = {};
    const nome = form.nome.trim();
    const emailAcesso = form.emailAcesso.trim();
    const cpfDigitos = somenteDigitos(form.cpf);
    const contaExistente = temContaAcesso(editando);
    const exigirEmailAcesso = !editando || contaExistente;
    const exigirSenha = !editando || alterarSenha || (!contaExistente && Boolean(emailAcesso));

    if (!nome) e.nome = 'Informe o nome completo.';
    if (!form.cargo) e.cargo = 'Selecione o cargo.';
    else if (!CARGOS.includes(form.cargo)) e.cargo = 'Cargo inválido.';
    if (!form.dataAdmissao) e.dataAdmissao = 'Informe a data de admissão.';
    if (form.salario !== '' && form.salario != null && !(Number(form.salario) > 0)) {
      e.salario = 'O salário deve ser maior que zero.';
    }
    if (form.email.trim() && !emailValido(form.email)) e.email = 'Informe um e-mail válido.';
    if (cpfDigitos) {
      if (!cpfValido(cpfDigitos)) e.cpf = 'Informe um CPF válido.';
      else if (funcionarios.some((f) => f.id !== editando?.id && somenteDigitos(f.cpf) === cpfDigitos)) {
        e.cpf = 'Já existe um funcionário cadastrado com este CPF.';
      }
    }
    if (form.cep && somenteDigitos(form.cep).length !== 8) e.cep = 'Informe um CEP com 8 dígitos.';
    if (form.estado.trim() && !/^[A-Za-z]{2}$/.test(form.estado.trim())) e.estado = 'Use a sigla do estado (ex.: SP).';

    // ===== Conta de acesso =====
    if (exigirEmailAcesso && !emailAcesso) e.emailAcesso = 'Informe o e-mail de acesso (usado no login).';
    if (emailAcesso && !emailValido(emailAcesso)) e.emailAcesso = 'Informe um e-mail de acesso válido.';
    if (emailAcesso && funcionarios.some((f) => f.id !== editando?.id
      && String(f.emailAcesso || '').toLowerCase() === emailAcesso.toLowerCase())) {
      e.emailAcesso = 'Já existe um funcionário com este e-mail de acesso.';
    }
    if (exigirSenha) {
      if (!form.senha) e.senha = contaExistente ? 'Informe a nova senha.' : 'Informe a senha inicial.';
      else if (form.senha.length < SENHA_MINIMA) e.senha = `A senha deve ter no mínimo ${SENHA_MINIMA} caracteres.`;
      if (form.confirmarSenha !== form.senha) e.confirmarSenha = 'As senhas não conferem.';
    }

    return e;
  };

  const handleSalvar = async (ev) => {
    ev.preventDefault();
    setErro('');
    setSucesso('');
    const validacao = validar();
    setErros(validacao);
    if (Object.keys(validacao).length > 0) return;

    setSalvando(true);
    try {
      const senhaParaEnviar = form.senha ? form.senha : null;   // vazio = manter a senha atual
      const payload = {
        nome: form.nome.trim(),
        cpf: somenteDigitos(form.cpf) || null,
        dataNascimento: form.dataNascimento || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        cargo: form.cargo,
        salario: form.salario !== '' && form.salario != null ? Number(form.salario) : null,
        dataAdmissao: form.dataAdmissao,
        situacao: form.situacao,
        cep: somenteDigitos(form.cep) || null,
        logradouro: form.logradouro.trim() || null,
        numero: form.numero.trim() || null,
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim().toUpperCase() || null,
        emailAcesso: form.emailAcesso.trim() || null,
        senha: senhaParaEnviar,
        confirmarSenha: senhaParaEnviar,
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
      const data = error.response?.data;
      const msg = data?.erro || data?.error || 'Não foi possível salvar o funcionário.';
      if (data?.campo) setErros({ [data.campo]: msg });
      else setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  /** Exclusão definitiva: o funcionário e a conta de acesso são removidos. */
  const handleDelete = async (func) => {
    const mensagem = temContaAcesso(func)
      ? `Excluir "${func.nome}"? A conta de acesso (login) deste funcionário também será excluída.`
      : `Excluir o funcionário "${func.nome}"?`;
    if (!window.confirm(mensagem)) return;

    setErro('');
    setSucesso('');
    try {
      await api.delete(`/funcionario/${func.id}`);
      setFuncionarios(funcionarios.filter((f) => f.id !== func.id));
      setSucesso(temContaAcesso(func)
        ? 'Funcionário e conta de acesso excluídos com sucesso.'
        : 'Funcionário excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir funcionário.';
      setErro(msg);
    }
  };

  // ========================== BUSCA DE CEP (ViaCEP) ==========================
  /**
   * Consulta o CEP no ViaCEP e preenche logradouro, bairro, cidade e UF.
   * Requisições repetidas para o mesmo CEP são ignoradas (evita chamar a API
   * duas vezes, pois a busca é disparada ao digitar e também no blur).
   */
  const buscarEnderecoPorCep = async (valorCep) => {
    const cep = somenteDigitos(valorCep);
    if (cep.length !== 8 || cep === ultimoCepBuscado.current) return;

    ultimoCepBuscado.current = cep;
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`);
      const data = await response.json();

      if (data.erro) {
        setErros((atual) => ({ ...atual, cep: 'CEP não encontrado. Confira o número informado.' }));
        return;
      }

      // Atualiza o estado do formulário com os dados do endereço retornados
      setForm((atual) => ({
        ...atual,
        cep: formatarCep(cep),
        logradouro: data.logradouro || atual.logradouro,
        bairro: data.bairro || atual.bairro,
        cidade: data.localidade || atual.cidade,
        estado: (data.uf || atual.estado).toUpperCase(),
      }));
      setErros((atual) => ({
        ...atual,
        cep: undefined,
        logradouro: undefined,
        bairro: undefined,
        cidade: undefined,
        estado: undefined,
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      ultimoCepBuscado.current = '';    // libera nova tentativa
      setErros((atual) => ({ ...atual, cep: 'Não foi possível buscar o CEP. Tente novamente.' }));
    } finally {
      setBuscandoCep(false);
    }
  };

  /** Digitação do CEP: formata e já busca o endereço ao completar 8 dígitos. */
  const handleCepChange = (valor) => {
    const formatado = formatarCep(valor);
    setForm((atual) => ({ ...atual, cep: formatado }));
    setErros((atual) => ({ ...atual, cep: undefined }));
    if (somenteDigitos(formatado).length !== 8) {
      ultimoCepBuscado.current = '';    // CEP incompleto: permite buscar depois
      return;
    }
    buscarEnderecoPorCep(formatado);
  };

  /** Saída do campo: garante a busca quando o CEP é colado/vindo de autofill. */
  const handleBlurCEP = () => {
    buscarEnderecoPorCep(form.cep);
  };

  const alternarAlterarSenha = (marcado) => {
    setAlterarSenha(marcado);
    setForm((atual) => ({ ...atual, senha: '', confirmarSenha: '' }));
    setErros((atual) => ({ ...atual, senha: undefined, confirmarSenha: undefined }));
  };

  const filtered = funcionarios.filter((f) => {
    const termo = search.trim().toLowerCase();
    if (!termo) return true;
    return [f.nome, f.cargo, f.telefone, f.cpf, f.email, f.emailAcesso]
      .some((valor) => String(valor || '').toLowerCase().includes(termo));
  });

  // Regras da seção "Acesso ao sistema" (novo funcionário x edição)
  const contaExistente = temContaAcesso(editando);
  const exigirEmailAcesso = !editando || contaExistente;
  const exigirSenha = !editando || alterarSenha || (!contaExistente && Boolean(form.emailAcesso.trim()));

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
              placeholder="Buscar por nome, cargo, CPF ou e-mail..."
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
          <div>
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
              <th style={{ width: 250 }}>Ações</th>
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
                  <td>
                    <div className="cell-stack">
                      <strong>{func.nome}</strong>
                      {func.emailAcesso && <span className="cell-sub">{func.emailAcesso}</span>}
                    </div>
                  </td>
                  <td>{func.cargo || '-'}</td>
                  <td>{func.telefone || '-'}</td>
                  <td><strong>{func.salario != null ? formatCurrency(func.salario) : '—'}</strong></td>
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
                        onClick={() => setDetalhe(func)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> Detalhes
                      </button>
                      {podeGerenciar && (
                        <>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => abrirEditar(func)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit size={12} /> Editar
                          </button>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(func)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </>
                      )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando ? (
                <span className="dialog-title-icon"><Edit size={18} /> Editar Funcionário</span>
              ) : (
                <span className="dialog-title-icon"><Plus size={18} /> Novo Funcionário</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? 'Atualize os dados do funcionário e a conta de acesso ao sistema.'
                : 'Cadastre o colaborador e a conta de acesso ao sistema.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="dialog-form">
            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* DADOS PESSOAIS */}
              <div className="form-group">
                <p className="form-group-title"><User size={14} /> Dados pessoais</p>
                <FormField label="Nome completo" required error={erros.nome}>
                  <input
                    className="theme-input"
                    type="text"
                    placeholder="Ex.: João da Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </FormField>
                <div className="form-grid-3">
                  <FormField label="CPF" error={erros.cpf} hint="Opcional">
                    <input
                      className="theme-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Data de nascimento" error={erros.dataNascimento}>
                    <DateInput
                      value={form.dataNascimento}
                      onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Telefone" error={erros.telefone}>
                    <input
                      className="theme-input"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                    />
                  </FormField>
                </div>
                <FormField label="E-mail pessoal" error={erros.email} hint="Opcional — não é usado para login">
                  <input
                    className="theme-input"
                    type="email"
                    placeholder="joao@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </FormField>
              </div>

              {/* DADOS PROFISSIONAIS */}
              <div className="form-group">
                <p className="form-group-title"><Briefcase size={14} /> Dados profissionais</p>
                <div className="form-grid-3">
                  <FormField label="Cargo" required error={erros.cargo} hint="Define o acesso no sistema">
                    <select
                      className="theme-select"
                      value={form.cargo}
                      onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    >
                      <option value="">Selecione o cargo</option>
                      {CARGOS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Salário" error={erros.salario}>
                    <MoneyInput
                      value={form.salario}
                      onChange={(valor) => setForm({ ...form, salario: valor ?? '' })}
                      placeholder="0,00"
                    />
                  </FormField>
                  <FormField label="Admissão" required error={erros.dataAdmissao}>
                    <DateInput
                      value={form.dataAdmissao}
                      onChange={(e) => setForm({ ...form, dataAdmissao: e.target.value })}
                    />
                  </FormField>
                </div>
                <FormField label="Situação" error={erros.situacao}>
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
              </div>

              {/* ENDEREÇO */}
              <div className="form-group">
                <p className="form-group-title"><MapPin size={14} /> Endereço</p>
                <div className="form-grid-3">
                  <FormField
                    label="CEP"
                    error={erros.cep}
                    hint={buscandoCep ? 'Buscando endereço...' : ''}
                    >
                  
                    <input
                      className="theme-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="00000-000"
                      maxLength={9}
                      value={form.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      onBlur={handleBlurCEP}
                    />
                  </FormField>
                  <FormField label="Logradouro" error={erros.logradouro}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="Rua / Avenida"
                      value={form.logradouro}
                      onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Número" error={erros.numero}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="123"
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    />
                  </FormField>
                </div>
                <div className="form-grid-2">
                  <FormField label="Complemento" error={erros.complemento}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="Apto / Bloco (opcional)"
                      value={form.complemento}
                      onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Bairro" error={erros.bairro}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="Centro"
                      value={form.bairro}
                      onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    />
                  </FormField>
                </div>
                <div className="form-grid-2">
                  <FormField label="Cidade" error={erros.cidade}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="São Paulo"
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Estado (UF)" error={erros.estado}>
                    <input
                      className="theme-input"
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    />
                  </FormField>
                </div>
              </div>

              {/* ACESSO AO SISTEMA */}
              <div className="form-group">
                <p className="form-group-title"><KeyRound size={14} /> Acesso ao sistema</p>
                <p className="dialog-hint" style={{ margin: 0 }}>
                  As áreas liberadas dependem do cargo selecionado — o funcionário não escolhe permissões.
                </p>
                <div className="form-grid-2">
                  <FormField
                    label="E-mail de acesso"
                    required={exigirEmailAcesso}
                    error={erros.emailAcesso}
                    hint="Este e-mail é usado no login"
                  >
                    <input
                      className="theme-input"
                      type="email"
                      autoComplete="off"
                      placeholder="funcionario@academia.com"
                      value={form.emailAcesso}
                      onChange={(e) => setForm({ ...form, emailAcesso: e.target.value })}
                    />
                  </FormField>
                  {contaExistente && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={alterarSenha}
                          onChange={(e) => alternarAlterarSenha(e.target.checked)}
                        />
                        Alterar senha
                      </label>
                    </div>
                  )}
                </div>

                {!contaExistente && (
                  <div className="form-grid-2">
                    <FormField
                      label="Senha inicial"
                      required={exigirSenha}
                      error={erros.senha}
                      hint={`Mínimo de ${SENHA_MINIMA} caracteres`}
                    >
                      <input
                        className="theme-input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Confirmar senha" required={exigirSenha} error={erros.confirmarSenha}>
                      <input
                        className="theme-input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.confirmarSenha}
                        onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                      />
                    </FormField>
                  </div>
                )}

                {contaExistente && alterarSenha && (
                  <div className="form-grid-2">
                    <FormField
                      label="Nova senha"
                      required
                      error={erros.senha}
                      hint={`Mínimo de ${SENHA_MINIMA} caracteres`}
                    >
                      <input
                        className="theme-input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Confirmar nova senha" required error={erros.confirmarSenha}>
                      <input
                        className="theme-input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.confirmarSenha}
                        onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                      />
                    </FormField>
                  </div>
                )}

                {editando && contaExistente && !alterarSenha && (
                  <p className="dialog-hint" style={{ margin: 0 }}>
                    A senha atual é mantida e nunca é exibida. Marque &quot;Alterar senha&quot; para definir uma nova.
                  </p>
                )}
                {editando && !contaExistente && (
                  <p className="dialog-hint" style={{ margin: 0 }}>
                    Este funcionário ainda não possui acesso ao sistema. Preencha o e-mail e a senha para criar a conta.
                  </p>
                )}
              </div>
            </div>

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

      {/* Ver detalhes do funcionário (dados cadastrais + acesso) */}
      <Dialog open={!!detalhe} onOpenChange={(open) => { if (!open) setDetalhe(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              <span className="dialog-title-icon"><Eye size={18} /> Detalhes do Funcionário</span>
            </DialogTitle>
            <DialogDescription>Dados cadastrais, endereço e acesso ao sistema.</DialogDescription>
          </DialogHeader>

          {detalhe && (
            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '1rem' }}>{detalhe.nome}</strong>
                <span className={`status-badge ${detalhe.situacao === 'ATIVO' ? 'ATIVO' : 'INATIVO'}`}>
                  {detalhe.situacao || 'INATIVO'}
                </span>
                {detalhe.cargo && <span className="status-badge FIXO">{detalhe.cargo}</span>}
              </div>

              <div className="form-group">
                <p className="form-group-title"><User size={14} /> Dados pessoais</p>
                <LinhaDetalhe label="Nome" valor={detalhe.nome} />
                <LinhaDetalhe label="CPF" valor={formatarCpf(detalhe.cpf)} />
                <LinhaDetalhe label="Data de nascimento" valor={formatDate(detalhe.dataNascimento)} />
                <LinhaDetalhe label="Telefone" valor={detalhe.telefone} />
                <LinhaDetalhe label="E-mail" valor={detalhe.email} />
              </div>

              <div className="form-group">
                <p className="form-group-title"><Briefcase size={14} /> Dados profissionais</p>
                <LinhaDetalhe label="Cargo" valor={detalhe.cargo} />
                <LinhaDetalhe label="Salário" valor={detalhe.salario != null ? formatCurrency(detalhe.salario) : null} />
                <LinhaDetalhe label="Data de admissão" valor={formatDate(detalhe.dataAdmissao)} />
                <LinhaDetalhe label="Situação" valor={detalhe.situacao} />
              </div>

              <div className="form-group">
                <p className="form-group-title"><MapPin size={14} /> Endereço</p>
                <LinhaDetalhe label="CEP" valor={formatarCep(detalhe.cep)} />
                <LinhaDetalhe label="Logradouro" valor={detalhe.logradouro} />
                <LinhaDetalhe label="Número" valor={detalhe.numero} />
                <LinhaDetalhe label="Complemento" valor={detalhe.complemento} />
                <LinhaDetalhe label="Bairro" valor={detalhe.bairro} />
                <LinhaDetalhe label="Cidade" valor={detalhe.cidade} />
                <LinhaDetalhe label="Estado" valor={detalhe.estado} />
              </div>

              {/* Nunca exibimos senha nem hash: apenas o vínculo da conta */}
              <div className="form-group">
                <p className="form-group-title"><ShieldCheck size={14} /> Acesso ao sistema</p>
                {temContaAcesso(detalhe) ? (
                  <>
                    <LinhaDetalhe label="E-mail de acesso" valor={detalhe.emailAcesso} />
                    <LinhaDetalhe label="Cargo/perfil" valor={detalhe.cargoAcesso || detalhe.cargo} />
                    <LinhaDetalhe
                      label="Situação da conta"
                      valor={detalhe.situacaoAcesso === 'ATIVA' ? 'Ativa (com acesso)' : 'Sem acesso'}
                    />
                  </>
                ) : (
                  <p className="dialog-hint" style={{ margin: 0 }}>
                    Este funcionário não possui conta de acesso ao sistema.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="dialog-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setDetalhe(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <X size={14} /> Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
