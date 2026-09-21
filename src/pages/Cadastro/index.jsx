import { useState, useEffect, useRef } from 'react';
import api from '../../service/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormField } from '../../components/ui/field';
import { DateInput } from '../../components/ui/date-input';
import {
  User, Phone, MapPin, HeartPulse, Dumbbell, Calendar,
  Check, CheckCircle2, AlertCircle, Save, Loader2,
} from 'lucide-react';

// ============================================================================
// Cadastro/edição de aluno.
//
// A página é usada tanto para criar (sem ?id) quanto para editar (?id=NN).
// Os planos abaixo são os únicos aceitos pelo sistema e não devem ser alterados
// (valores e durações também definem a primeira mensalidade gerada no cadastro).
// ============================================================================
const PLANOS = [
  { nome: 'Plano Mensal', valor: 120.0, duracao: 30 },
  { nome: 'Plano Trimestral', valor: 330.0, duracao: 90 },
  { nome: 'Plano Semestral', valor: 600.0, duracao: 180 },
  { nome: 'Plano Anual', valor: 1100.0, duracao: 365 },
];

const SITUACOES = [
  { valor: 'ATIVO', rotulo: 'Ativo' },
  { valor: 'INATIVO', rotulo: 'Inativo' },
  { valor: 'SUSPENSO', rotulo: 'Suspenso' },
  { valor: 'CANCELADO', rotulo: 'Cancelado' },
];

const rotuloSituacao = (valor) =>
  SITUACOES.find((s) => s.valor === valor)?.rotulo || 'Ativo';

// 1. FUNÇÕES DE FORMATAÇÃO
const somenteDigitos = (valor) => String(valor || '').replace(/\D/g, '');

const formatarTelefone = (valor) => {
  valor = valor.replace(/\D/g, ""); // Remove tudo que não é número
  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d)(\d{4})$/, "$1-$2");
  return valor;
};

const formatarCpf = (valor) => {
  valor = valor.replace(/\D/g, ""); // Remove tudo que não é número
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Agora vai aplicar o hífen corretamente
  return valor;
};

const formatarCep = (valor) => {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** Estado inicial do formulário (inclui os campos legados preservados). */
const estadoInicial = () => ({
  // Dados pessoais
  nome: '', cpf: '', dataNascimento: '', sexo: '',
  // Contato
  telefone: '', email: '',
  // Contato de emergência
  contatoEmergenciaNome: '', contatoEmergenciaTelefone: '',
  // Endereço estruturado
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '',
  // Plano / situação
  plano: '', observacoes: '', situacao: 'ATIVO', dataMatricula: '',
  // Campos antigos (texto único). Não são editados na tela, apenas enviados de
  // volta para que cadastros antigos não percam informação ao serem salvos.
  endereco: '', contatoEmergencia: '',
});

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();

  const [form, setForm] = useState(estadoInicial());
  const [message, setMessage] = useState('');
  const [planoSel, setPlanoSel] = useState(null);
  const [erros, setErros] = useState({});

  // --- Busca de CEP (ViaCEP) ---
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState('');     // mensagem discreta (não encontrado / falha)
  const [cepPreenchido, setCepPreenchido] = useState(false);
  // Guarda o último CEP consultado: evita repetir a requisição (digitação + blur)
  const ultimoCepBuscado = useRef('');
  const timerCep = useRef(null);

  // --- Dados legados (endereço/contato em campo único) ---
  const [enderecoLegado, setEnderecoLegado] = useState('');
  const [contatoLegadoImportado, setContatoLegadoImportado] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/aluno/${id}`).then(res => {
        const a = res.data;
        const contatoNome = a.contatoEmergenciaNome || '';
        // Cadastros antigos guardavam o contato de emergência em um único campo.
        // Ele é trazido para o campo "Nome" para que o dado seja exibido/editado
        // e, principalmente, continue salvo (o valor antigo é reenviado no save).
        const importouContatoAntigo = !contatoNome && Boolean(a.contatoEmergencia);

        setForm({
          nome: a.nome || '',
          cpf: formatarCpf(a.cpf || ''),
          dataNascimento: a.dataNascimento || '',
          sexo: a.sexo || '',
          telefone: formatarTelefone(a.telefone || ''),
          email: a.email || '',
          contatoEmergenciaNome: contatoNome || (importouContatoAntigo ? a.contatoEmergencia : ''),
          contatoEmergenciaTelefone: formatarTelefone(a.contatoEmergenciaTelefone || ''),
          cep: formatarCep(a.cep || ''),
          logradouro: a.logradouro || '',
          numero: a.numero || '',
          complemento: a.complemento || '',
          bairro: a.bairro || '',
          plano: a.plano || '',
          observacoes: a.observacoes || '',
          situacao: a.situacao || 'ATIVO',
          dataMatricula: a.dataMatricula || '',
          endereco: a.endereco || '',
          contatoEmergencia: a.contatoEmergencia || '',
        });
        setEnderecoLegado(a.endereco || '');
        setContatoLegadoImportado(importouContatoAntigo);
        if (a.cep) ultimoCepBuscado.current = somenteDigitos(a.cep);
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

  // Cancela um agendamento de busca de CEP pendente ao sair da tela
  useEffect(() => () => clearTimeout(timerCep.current), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === 'telefone' || name === 'contatoEmergenciaTelefone') {
      valorFormatado = formatarTelefone(value);
    } else if (name === 'cpf') {
      valorFormatado = formatarCpf(value);
    }

    setForm({ ...form, [name]: valorFormatado });
  };

  // ========================== BUSCA DE CEP (ViaCEP) ==========================
  /**
   * Consulta o CEP no ViaCEP e preenche logradouro e bairro. Número e
   * complemento continuam sendo digitados pelo usuário. Se a consulta falhar,
   * nada é bloqueado: o endereço pode ser preenchido manualmente.
   */
  const buscarEnderecoPorCep = async (valorCep) => {
    const cep = somenteDigitos(valorCep);
    if (cep.length !== 8 || cep === ultimoCepBuscado.current) return;

    ultimoCepBuscado.current = cep;
    setBuscandoCep(true);
    setAvisoCep('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`);
      const data = await response.json();

      if (data.erro) {
        // CEP inexistente: apenas avisa e libera o preenchimento manual
        setCepPreenchido(false);
        setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      setForm((atual) => ({
        ...atual,
        cep: formatarCep(cep),
        logradouro: data.logradouro || atual.logradouro,
        bairro: data.bairro || atual.bairro,
      }));
      setCepPreenchido(true);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      ultimoCepBuscado.current = ''; // libera nova tentativa
      setCepPreenchido(false);
      setAvisoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  /**
   * Digitação do CEP: aplica a máscara e agenda a consulta quando os 8 dígitos
   * estiverem completos. O pequeno atraso evita consultar a API a cada tecla.
   */
  const handleCepChange = (e) => {
    const formatado = formatarCep(e.target.value);
    setForm((atual) => ({ ...atual, cep: formatado }));
    setAvisoCep('');
    setCepPreenchido(false);
    clearTimeout(timerCep.current);

    const cep = somenteDigitos(formatado);
    if (cep.length !== 8) {
      ultimoCepBuscado.current = ''; // CEP incompleto: permite buscar depois
      return;
    }
    if (cep === ultimoCepBuscado.current) return;
    timerCep.current = setTimeout(() => buscarEnderecoPorCep(cep), 500);
  };

  /** Saída do campo: garante a consulta quando o CEP é colado/autopreenchido. */
  const handleCepBlur = () => {
    clearTimeout(timerCep.current);
    buscarEnderecoPorCep(form.cep);
  };

  /** Dica exibida abaixo do CEP (carregando / não encontrado / preenchido). */
  const dicaCep = () => {
    if (buscandoCep) {
      return (
        <span className="hint-info">
          <Loader2 size={13} className="is-spinning" /> Buscando endereço...
        </span>
      );
    }
    if (avisoCep) {
      return (
        <span className="hint-aviso">
          <AlertCircle size={13} /> {avisoCep}
        </span>
      );
    }
    if (cepPreenchido) {
      return (
        <span className="hint-ok">
          <Check size={13} /> Rua e bairro preenchidos pelo CEP.
        </span>
      );
    }
    return 'Informe o CEP para preencher rua e bairro automaticamente.';
  };

  // ============================ SALVAR ============================
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

    // O CEP vai apenas com dígitos (mesmo formato usado em Funcionários) e os
    // campos opcionais vazios viram null.
    const payload = {
      ...form,
      cep: somenteDigitos(form.cep) || null,
      logradouro: form.logradouro.trim() || null,
      numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim() || null,
      contatoEmergenciaNome: form.contatoEmergenciaNome.trim() || null,
      contatoEmergenciaTelefone: form.contatoEmergenciaTelefone.trim() || null,
    };

    try {
      if (id) {
        await api.put(`/aluno/${id}`, { ...payload, id: Number(id) });
        setMessage('✅ Aluno atualizado com sucesso!');
      } else {
        const r = await api.post('/aluno', { ...payload, dataMatricula: obterDataHoje(), situacao: 'ATIVO' });
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
        setForm(estadoInicial());
        setEnderecoLegado('');
        setContatoLegadoImportado(false);
        setAvisoCep('');
        setCepPreenchido(false);
        ultimoCepBuscado.current = '';
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
        {/* ===================== DADOS PESSOAIS ===================== */}
        <div className="form-section">
          <h3 className="section-title"><User size={16} /> Dados Pessoais</h3>
          <div className="theme-form-row">
            <FormField label="Nome" required error={erros.nome}>
              <input className="theme-input" name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" />
            </FormField>
            <FormField label="CPF" required error={erros.cpf}>
              <input className="theme-input" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength="14" />
            </FormField>
          </div>
          {id ? (
            <div className="form-grid-3">
              <FormField label="Data de Nascimento" error={erros.dataNascimento}>
                <DateInput name="dataNascimento" value={form.dataNascimento} onChange={handleChange} />
              </FormField>
              <FormField label="Sexo" error={erros.sexo}>
                <select className="theme-select" name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </FormField>
              <FormField label="Situação do Aluno" error={erros.situacao}>
                <select className="theme-select" name="situacao" value={form.situacao} onChange={handleChange}>
                  {SITUACOES.map((s) => (
                    <option key={s.valor} value={s.valor}>{s.rotulo}</option>
                  ))}
                </select>
              </FormField>
            </div>
          ) : (
            <div className="theme-form-row">
              <FormField label="Data de Nascimento" error={erros.dataNascimento}>
                <DateInput name="dataNascimento" value={form.dataNascimento} onChange={handleChange} />
              </FormField>
              <FormField label="Sexo" error={erros.sexo}>
                <select className="theme-select" name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </FormField>
            </div>
          )}
        </div>

        {/* ===================== CONTATO ===================== */}
        <div className="form-section">
          <h3 className="section-title"><Phone size={16} /> Contato</h3>
          <div className="theme-form-row">
            <FormField label="Telefone" error={erros.telefone}>
              <input className="theme-input" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength="15" />
            </FormField>
            <FormField label="Email" required error={erros.email}>
              <input className="theme-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@exemplo.com" />
            </FormField>
          </div>
        </div>

        {/* ===================== ENDEREÇO ===================== */}
        <div className="form-section">
          <h3 className="section-title"><MapPin size={16} /> Endereço</h3>
          <div className="form-grid-cep">
            <FormField label="CEP" hint={dicaCep()} error={erros.cep}>
              <input
                className="theme-input"
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
                value={form.cep}
                onChange={handleCepChange}
                onBlur={handleCepBlur}
                disabled={buscandoCep}
              />
            </FormField>
            <FormField label="Número" error={erros.numero}>
              <input className="theme-input" type="text" name="numero" value={form.numero} onChange={handleChange} placeholder="123" />
            </FormField>
          </div>
          <FormField label="Rua" error={erros.logradouro}>
            <input className="theme-input" type="text" name="logradouro" value={form.logradouro} onChange={handleChange} placeholder="Nome da rua ou avenida" />
          </FormField>
          <div className="theme-form-row">
            <FormField label="Bairro" error={erros.bairro}>
              <input className="theme-input" type="text" name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" />
            </FormField>
            <FormField label="Complemento" hint="Apartamento, bloco, etc. (opcional)" error={erros.complemento}>
              <input className="theme-input" type="text" name="complemento" value={form.complemento} onChange={handleChange} placeholder="Opcional" />
            </FormField>
          </div>
          {enderecoLegado && !form.logradouro && !form.cep && (
            <p className="field-hint" style={{ color: 'var(--text-muted)' }}>
              Endereço anterior (cadastro antigo) preservado: {enderecoLegado}
            </p>
          )}
        </div>

        {/* ===================== CONTATO DE EMERGÊNCIA ===================== */}
        <div className="form-section">
          <h3 className="section-title"><HeartPulse size={16} /> Contato de Emergência</h3>
          <div className="theme-form-row">
            <FormField
              label="Nome"
              error={erros.contatoEmergenciaNome}
              hint={contatoLegadoImportado ? 'Valor importado do cadastro antigo.' : ''}
            >
              <input className="theme-input" type="text" name="contatoEmergenciaNome" value={form.contatoEmergenciaNome} onChange={handleChange} placeholder="Nome completo" />
            </FormField>
            <FormField label="Telefone" error={erros.contatoEmergenciaTelefone}>
              <input className="theme-input" type="tel" name="contatoEmergenciaTelefone" value={form.contatoEmergenciaTelefone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength="15" />
            </FormField>
          </div>
        </div>

        {/* ===================== PLANO ===================== */}
        <div className="form-section">
          <h3 className="section-title"><Dumbbell size={16} /> Plano</h3>
          <div className="theme-form-row">
            <FormField label="Plano Contratado" required error={erros.plano} hint="1ª mensalidade gerada automaticamente">
              <select className="theme-select" name="plano" value={form.plano} onChange={handleChange}>
                <option value="">Selecione um Plano</option>
                {PLANOS.map(p => (
                  <option key={p.nome} value={p.nome}>{p.nome} — R$ {p.valor.toFixed(2)} ({p.duracao} dias)</option>
                ))}
              </select>
            </FormField>
            <FormField label="Observações" hint="Informações complementares (opcional)">
              <textarea className="theme-textarea" name="observacoes" value={form.observacoes} onChange={handleChange} rows={3} placeholder="Observações sobre o aluno..." />
            </FormField>
          </div>

          {planoSel && (
            <div className="form-group matricula-resumo">
              <p className="form-group-title"><Calendar size={14} /> Resumo da Matrícula</p>
              <div className="resumo-grid">
                <div className="resumo-item">
                  <span className="resumo-label">Plano</span>
                  <strong className="resumo-valor">{planoSel.nome}</strong>
                </div>
                <div className="resumo-item">
                  <span className="resumo-label">Valor</span>
                  <strong className="resumo-valor resumo-valor-destaque">
                    R$ {planoSel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="resumo-item">
                  <span className="resumo-label">{id ? 'Duração' : '1ª mensalidade'}</span>
                  <strong className="resumo-valor">em {planoSel.duracao} dias</strong>
                </div>
                <div className="resumo-item">
                  <span className="resumo-label">Situação</span>
                  <span className={`status-badge ${form.situacao || 'ATIVO'}`}>{rotuloSituacao(form.situacao)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            {id ? 'Salvar Alterações' : 'Finalizar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
}




