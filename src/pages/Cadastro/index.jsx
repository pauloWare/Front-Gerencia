import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormField } from '../../components/ui/field';
import { DateInput } from '../../components/ui/date-input';
import { ClipboardList, Phone, Dumbbell, Calendar, Check, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const PLANOS = [
  { nome: 'Plano Mensal', valor: 120.0, duracao: 30 },
  { nome: 'Plano Trimestral', valor: 330.0, duracao: 90 },
  { nome: 'Plano Semestral', valor: 600.0, duracao: 180 },
  { nome: 'Plano Anual', valor: 1100.0, duracao: 365 },
];

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', cpf: '', dataNascimento: '', sexo: '', telefone: '',
    email: '', endereco: '', contatoEmergencia: '', plano: '', observacoes: '',
    situacao: 'ATIVO', dataMatricula: '',
  });
  const [message, setMessage] = useState('');
  const [planoSel, setPlanoSel] = useState(null);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (id) {
      api.get(`/aluno/${id}`).then(res => {
        const a = res.data;
        setForm({
          nome: a.nome || '', cpf: a.cpf || '', dataNascimento: a.dataNascimento || '',
          sexo: a.sexo || '', telefone: a.telefone || '', email: a.email || '',
          endereco: a.endereco || '', contatoEmergencia: a.contatoEmergencia || '',
          plano: a.plano || '', observacoes: a.observacoes || '',
          situacao: a.situacao || 'ATIVO', dataMatricula: a.dataMatricula || '',
        });
      }).catch(err => {
        console.error(err);
        setMessage('❌ Erro ao carregar dados do aluno.');
      });
    }
  }, [id]);

  useEffect(() => {
    const p = PLANOS.find(p => p.nome === form.plano);
    setPlanoSel(p || null);
  }, [form.plano]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const obterDataHoje = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
  };

  const calcularVencimento = (dias) => {
    const h = new Date();
    h.setDate(h.getDate() + dias);
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = 'Este campo é obrigatório.';
    if (!form.cpf.trim()) novosErros.cpf = 'Este campo é obrigatório.';
    if (!form.email.trim()) novosErros.email = 'Este campo é obrigatório.';
    if (!form.plano) novosErros.plano = 'Selecione um plano.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      setMessage('');
      return;
    }
    try {
      if (id) {
        await api.put(`/aluno/${id}`, { ...form, id: Number(id) });
        setMessage('✅ Aluno atualizado com sucesso!');
      } else {
        const r = await api.post('/aluno', { ...form, dataMatricula: obterDataHoje(), situacao: 'ATIVO' });
        const novo = r.data;
        if (planoSel && novo && novo.id) {
          await api.post('/mensalidade', {
            aluno: { id: novo.id },
            dataVencimento: calcularVencimento(planoSel.duracao),
            valor: planoSel.valor,
            status: 'PENDENTE'
          });
        }
        setMessage('✅ Aluno cadastrado com sucesso e primeira mensalidade gerada!');
        setForm({
          nome: '', cpf: '', dataNascimento: '', sexo: '', telefone: '',
          email: '', endereco: '', contatoEmergencia: '', plano: '', observacoes: '',
          situacao: 'ATIVO', dataMatricula: '',
        });
      }
      setTimeout(() => navigate('/alunos'), 1500);
    } catch (err) {
      console.error(err);
      setMessage(id ? '❌ Erro ao atualizar aluno.' : '❌ Erro ao cadastrar aluno.');
    }
  };

  return (

      <div className="theme-card">
        {message && (
          <div className={`form-message ${message.includes('✅') ? 'success' : 'error'}`} style={{ marginBottom: 20 }}>
            {message.includes('✅') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.replace('✅ ', '').replace('❌ ', '')}</span>
          </div>
        )}

        <form className="theme-form" onSubmit={handleSubmit}>
          {/* Dados Pessoais */}
          <div className="form-section">
            <h3 className="section-title"><ClipboardList size={16} /> Dados Pessoais</h3>
            <div className="theme-form-row">
              <FormField label="Nome" required error={erros.nome}>
                <input className="theme-input" name="nome" value={form.nome} onChange={handleChange} />
              </FormField>
              <FormField label="CPF" required error={erros.cpf}>
                <input className="theme-input" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
              </FormField>
            </div>
            <div className="theme-form-row">
              <FormField label="Data de Nascimento">
                <DateInput name="dataNascimento" value={form.dataNascimento} onChange={handleChange} />
              </FormField>
              <FormField label="Sexo">
                <select className="theme-select" name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </FormField>
            </div>
            {id && (
              <div className="theme-form-row">
                <FormField label="Situação do Aluno" className="field-max-50">
                  <select className="theme-select" name="situacao" value={form.situacao} onChange={handleChange}>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="SUSPENSO">Suspenso</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </FormField>
              </div>
            )}
          </div>

          {/* Contato */}
          <div className="form-section">
            <h3 className="section-title"><Phone size={16} /> Contato</h3>
            <div className="theme-form-row">
              <FormField label="Telefone">
                <input className="theme-input" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
              </FormField>
              <FormField label="Email" required error={erros.email}>
                <input className="theme-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@exemplo.com" />
              </FormField>
            </div>
            <div className="theme-form-row">
              <FormField label="Endereço">
                <input className="theme-input" name="endereco" value={form.endereco} onChange={handleChange} />
              </FormField>
              <FormField label="Contato de Emergência">
                <input className="theme-input" name="contatoEmergencia" value={form.contatoEmergencia} onChange={handleChange} />
              </FormField>
            </div>
          </div>

          {/* Plano */}
          <div className="form-section">
            <h3 className="section-title"><Dumbbell size={16} /> Plano</h3>
            <div className="theme-form-row">
              <FormField label="Plano Contratado" required error={erros.plano}>
                <select className="theme-select" name="plano" value={form.plano} onChange={handleChange}>
                  <option value="">Selecione um Plano</option>
                  {PLANOS.map(p => (
                    <option key={p.nome} value={p.nome}>{p.nome} — R$ {p.valor.toFixed(2)} ({p.duracao} dias)</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Observações">
                <textarea className="theme-textarea" name="observacoes" value={form.observacoes} onChange={handleChange} rows={3} />
              </FormField>
            </div>
          </div>

          {planoSel && (
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed #3b82f6', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> Resumo da Matrícula</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Plano</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{planoSel.nome}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Valor</span>
                  <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>R$ {planoSel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Vencimento</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{planoSel.duracao} dias</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status Inicial</span>
                  <span className="status-badge ATIVO" style={{ fontSize: '0.75rem', padding: '2px 8px', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Ativo</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            {id ? 'Salvar Alterações' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
  );
}