import { useSearchParams, useNavigate } from 'react-router-dom';
import AlunoForm from './AlunoForm';

// ============================================================================
// Página /cadastro — mantida por compatibilidade (links/edição existentes).
//
// Criação SEM ?id e edição COM ?id=NN. O formulário real vive em AlunoForm
// (mesmo componente usado no modal "+ Novo aluno" da página /alunos).
// Após salvar pela página, mantém o comportamento anterior: volta p/ /alunos.
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
        onSucesso={() => {
          setTimeout(() => navigate('/alunos'), 1500);
        }}
      />
    </div>
  );
}
