import api from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CadastroAluno() {
  const [vnome, setNome] = useState('');
  const [vdesc, setDesc] = useState('');
  const [vpreco, setPreco] = useState('');
  const [vdataNasc, setDataNasc] = useState('');
  const [vativo, setAtivo] = useState(true);
  const [vimagem, setImg] = useState(''); // Estado para armazenar a imagem em Base64
  const [fileName, setFileName] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página

    if (!vnome.trim()) {
      alert("Nome do aluno é obrigatório!");
      return;
    }

    try {
      // Envia os dados para o json-server
      await api.post("http://localhost:3001/produtos", {
        nome: vnome,
        descricao: vdesc,
        precovenda: vpreco,
        dataNascimento: vdataNasc,
        ativo: vativo,
        imagem: vimagem, // Armazena a imagem em base64
      });

      // Limpa os campos após o envio
      setNome('');
      setDesc('');
      setPreco('');
      setDataNasc('');
      setAtivo(true);
      setImg(''); // Limpa a imagem
      setFileName(''); // Limpa o nome da imagem

      console.log("Cadastro feito com sucesso! Redirecionando...");
      navigate('/home'); // Redireciona para a página de consulta
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      alert("Erro ao cadastrar aluno. Verifique o backend ou CORS.");
    }
  };

  const handleDataChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length > 4) {
      value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }

    setDataNasc(value);
  };

  return (
    <div className="app-container">
      <h2>Cadastro do aluno</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do aluno</label>
          <input
            type="text"
            placeholder="Seu nome aqui"
            value={vnome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="text"
            placeholder="Digite seu email aqui"
            value={vdesc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input
            type="text"
            placeholder="Sua senha aqui"
            value={vpreco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>

        {/* Campo para seleção de imagem */}
        <div className="form-group">
          <label>Foto de perfil</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onloadend = () => {
                setImg(reader.result); // Salva a imagem em Base64
              };
              if (file) {
                reader.readAsDataURL(file); // Lê o arquivo
                setFileName(file.name); // Armazena o nome do arquivo
              }
            }}
          />
        </div>

        <div className="form-group">
          <label>Sua data de nascimento:</label>
          <input
            type="text"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={vdataNasc}
            onChange={handleDataChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Como conheceu a academia?</label>
          <input type="checkbox" id="checkbox1" name="checkbox" /> Indicação <br />
          <input type="checkbox" id="checkbox2" name="checkbox" /> Passando na frente <br />
          <input type="checkbox" id="checkbox3" name="checkbox" /> Outra <br />
        </div>

        <button type="submit">
          Clique aqui para se cadastrar e ir para a home
        </button>
      </form>
    </div>
  );
}
