import { useSearchParams, useNavigate } from 'react-router-dom';
import AlunoForm from './AlunoForm';

// ============================================================================
// Página /cadastro — mantida por compatibilidade (links/edição existentes).
//
// Criação SEM ?id e edição COM ?id=NN. O formulário real vive em AlunoForm
// (mesmo componente usado no modal "+ Novo aluno" da página /alunos).
// Após salvar pela página, mantém o comportamento anterior: volta p/ /alunos.
// Se houver código/aviso de ativação p/ a recepção ler, a navegação espera
// (a confirmação fica visível no formulário).
// ============================================================================
export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();

  return (
    <div className="theme-card">
      <AlunoForm
        idAluno={id}
        modo="pagina"
        formId="aluno-form-pagina"
        onSucesso={(aluno, infoAtivacao) => {
          const esperaLeitura = Boolean(infoAtivacao?.codigo || infoAtivacao?.aviso);
          setTimeout(() => navigate('/alunos'), esperaLeitura ? 15000 : 1500);
        }}
      />
    </div>
  );
}
