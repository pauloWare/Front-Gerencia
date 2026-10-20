export const PLANOS_ALUNO = [
  { nome: 'Plano Mensal', valor: 120.0, duracao: 30 },
  { nome: 'Plano Trimestral', valor: 330.0, duracao: 90 },
  { nome: 'Plano Semestral', valor: 600.0, duracao: 180 },
  { nome: 'Plano Anual', valor: 1100.0, duracao: 365 },
];

/** Estado inicial do formulário (inclui os campos legados preservados). */
export function estadoInicialAlunoForm() {
  return {
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
  };
}

/** Chave de comparação de texto: sem acento e sem caixa. */
const chaveTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Diz se um plano é o "mensal": nome contém "mensal" e não contém
 * "trimestral/semestral/anual". Duração 30 dias e valor 120 servem de
 * critério de apoio quando o plano traz esses campos.
 */
export function ehPlanoMensal(plano) {
  if (!plano) return false;
  const nome = chaveTexto(plano.nome);
  if (!nome.includes('mensal')) return false;
  if (nome.includes('trimestral') || nome.includes('semestral') || nome.includes('anual')) {
    return false;
  }
  if (plano.duracao != null && Number(plano.duracao) !== 30) return false;
  if (plano.valor != null && Number(plano.valor) !== 120) return false;
  return true;
}

/** Primeiro plano mensal de uma lista (ou null, se nenhum atender). */
export function encontrarPlanoMensal(planos) {
  return (planos || []).find(ehPlanoMensal) || null;
}
