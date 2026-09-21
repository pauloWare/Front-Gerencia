import "./home.css";
import { useNavigate } from "react-router-dom";

// IMPORTAÇÃO DAS IMAGENS
import acdLogo from "../../assets/img/acd.jpg";
import slide1 from "../../assets/img/equipamentosTEC.png";
import slide2 from "../../assets/img/personalTEC.png";
import slide3 from "../../assets/img/horariosTEC.png";

/* FRAMER MOTION */
import { motion, useScroll, useTransform } from "framer-motion";

/* SWIPER */
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function Home() {
  const navigate = useNavigate();

  // O useScroll monitora o progresso do scroll na página
  const { scrollYProgress } = useScroll();

  // Mapeamos o scroll: 
  // Quando o scroll estiver entre 0 e 0.2 (os primeiros 20% da página),
  // o valor do fade vai de 0 a 1.
  // Isso garante que o efeito seja fluido e responsivo.
  const fadeValue = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  function handleClick() {
    navigate("/assinaturas");
  }

  return (
    <div>
      {/* HERO - Usamos motion.section para aceitar valores dinâmicos */}
      <motion.section
        className="homeF"
        style={{ "--fade-opacity": fadeValue }}
      >
        <div className="overlay">
          <h1>Transforme seu corpo, mente e rotina!</h1>
          <p>Planos acessíveis e estrutura completa pra você treinar no seu ritmo.</p>

          <button className="hero-btn" onClick={handleClick}>
            Conheça nossos planos
          </button>
        </div>
      </motion.section>
      

     {/* BENEFITS */}

     
<section className="benefits">
  <Swiper
    modules={[Navigation, Autoplay]}
    navigation
    autoplay={{ delay: 5000, disableOnInteraction: false }}
    loop
    className="mySwiper"
  >
    
    {/* SLIDE 1 */}
    <SwiperSlide className="slide">
      <div className="slide-content">
        <img src={slide1} alt="Equipamentos" className="slide-img" />
        <h2>Equipamentos modernos</h2>
        <p>Treine com máquinas de última geração.</p>
      </div>
    </SwiperSlide>

    {/* SLIDE 2 */}
    <SwiperSlide className="slide">
      <div className="slide-content">
        <img src={slide2} alt="Personal" className="slide-img" />
        <h2> Personal qualificado</h2>
        <p>Acompanhamento profissional para seus objetivos.</p>
      </div>
    </SwiperSlide>

    {/* SLIDE 3 - TABELA */}
    <SwiperSlide className="slide">
      <div className="slide-content">
        <img src={slide3} alt="Tabela de Horários" className="slide-img tabela-especifica" />
        <h2>Horários flexíveis</h2>
        <p>Aberto cedo até de noite pra encaixar na sua rotina.</p>
      </div>
    </SwiperSlide>
  </Swiper>
</section>


     
<section className="gallery">
  <motion.h2
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    Nosso espaço
  </motion.h2>

  <motion.div 
    className="gallery-grid"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: 0.2 }}
  >
    <img src={acdLogo} alt="" />
    <img src={acdLogo} alt="" />
    <img src={acdLogo} alt="" />
  </motion.div>
</section>

      {/* SOCIAL */}
      <section className="social">
        <h2>Acompanhe a gente</h2>
        <p>@bumbumguloso</p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer">
          <button className="hero-btn">Ver Instagram</button>
        </a>
      </section>

      {/* CONTACT */}
      <section className="contact">
        <div className="contact-container">
          <div className="contact-info">
            <h2>Venha nos visitar!</h2>
            <p>📍 Rua Pepezinho, 123 - Centro - Barueri/SP</p>
            <p>🕐 Segunda a sábado, das 6h às 22h</p>
          </div>
          <div className="contact-action">
            <h3>Fale com a gente</h3>
            <a
              href="https://web.whatsapp.com/send?phone=5511950708232&text=Olá!%20Quero%20saber%20mais."
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="whatsapp-btn">
                Chamar no WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}