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
