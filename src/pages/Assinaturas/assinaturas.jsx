import './assinaturas.css';
import { useEffect, useState } from 'react';

export default function Link_Assinatura() {
  const imagensEspaco = ["/img/img1.jpg", "/img/img2.jpg", "/img/img3.jpg", "/img/img4.jpg"];
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceAtual(prev => (prev + 1) % imagensEspaco.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [imagensEspaco.length]);

  const planos = [
    {
      nome: "Básico",
      preco: "89,90",
      classe: "comum",
      badge: "ECONÔMICO",
      beneficios: ["Acesso Musculação", "Área de Cardio", "Vestiários", "Suporte Básico"]
    },
    {
      nome: "Intermediário",
      preco: "129,90",
      classe: "destaque",
      badge: "MAIS POPULAR",
      beneficios: ["Todos do Básico", "Aulas de Ginástica", "Spinning & HIIT", "Avaliação Mensal"]
    },
    {
      nome: "Premium",
      preco: "199,90",
      classe: "vip",
      badge: "EXPERIÊNCIA VIP",
      beneficios: ["Todos do Intermediário", "Acesso 24 Horas", "Consultoria Nutricional", "Massagem Relaxante"]
    }
  ];

  return (
    <div className="pagina-assinaturas">
      <section className="hero2">
        <h1>Transforme sua rotina!</h1>
        <p>Compare nossos planos e escolha o que melhor se adapta ao seu objetivo.</p>
      </section>

      <div className="grid-planos-novo">
        {planos.map((plano, index) => (
          <div key={index} className={`card-plano-v2 ${plano.classe}`}>
            <div className="badge-topo">{plano.badge}</div>
            <h3>{plano.nome}</h3>
            <div className="preco-container">
              <span className="cifrao">R$</span>
              <span className="valor">{plano.preco}</span>
              <span className="mes">/mês</span>
            </div>
            
            <ul className="lista-beneficios">
              {plano.beneficios.map((item, i) => (
                <li key={i}><span>✔</span> {item}</li>
              ))}
            </ul>

            <button className="btn-comprar">ASSINAR AGORA</button>
          </div>
        ))}
      </div>

      <section className="nosso-espaco">
        <h2>Nossas Unidades</h2>
        <div className="carrossel-container">
          {imagensEspaco.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Imagem do espaço ${i + 1}`}
              className={i === indiceAtual ? "ativo" : ""}
            />
          ))}
        </div>
      </section>

      <section className="contact">
        <h2>Venha nos visitar!</h2>
        <p>📍 Rua Exemplo, 123 - Centro - Barueri/SP</p>
        <p>🕐 Segunda a sábado, das 6h às 22h</p>
        <a 
          href="https://wa.me/5511950708232?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20planos." 
          target="_blank" 
          rel="noreferrer"
        >
          <button className="botaoWhatsapp">
            Chamar no WhatsApp
          </button>
        </a>
      </section>
    </div>
  );
}