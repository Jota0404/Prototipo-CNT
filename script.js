// ==========================================
// 1. ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let currentStep = 0;

// Objeto que guardará todas as escolhas para envio posterior
const answers = {
  tipo: '',
  roupa: '',
  transporte: '',
  animacao: '7',
  pedido: '',
  dia: ''
};

// ==========================================
// 2. LÓGICA DO BOTÃO "NÃO" FUJÃO
// ==========================================
const btnNao = document.getElementById('btn-nao');

function moveNaoButton() {
  const margin = 20; // Margem de respiro para não encostar nas bordas
  
  // Calcula o limite máximo baseado no tamanho visível da tela atual
  const maxX = window.innerWidth - btnNao.offsetWidth - margin;
  const maxY = window.innerHeight - btnNao.offsetHeight - margin;

  // Garante que o número gerado nunca seja negativo em telas muito pequenas
  const randomX = Math.max(margin, Math.floor(Math.random() * maxX));
  const randomY = Math.max(margin, Math.floor(Math.random() * maxY));

  btnNao.style.position = 'fixed';
  btnNao.style.left = `${randomX}px`;
  btnNao.style.top = `${randomY}px`;
}

// Suporta tanto o mouse (desktop) quanto o toque (mobile)
btnNao.addEventListener('mouseover', moveNaoButton);
btnNao.addEventListener('touchstart', (e) => {
  e.preventDefault(); 
  moveNaoButton();
});

// ==========================================
// 3. SISTEMA DE NAVEGAÇÃO E PROGRESSO
// ==========================================
// Transição da tela Teaser (Intro) para o Convite (Step 0)
document.getElementById('btn-intro').addEventListener('click', () => {
  document.getElementById('step-intro').classList.remove('active');
  document.getElementById('step-0').classList.add('active');
});

// Transição do "Sim" para as perguntas
document.getElementById('btn-sim').addEventListener('click', () => nextStep(1));

function nextStep(step) {
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep = step;
  document.getElementById(`step-${currentStep}`).classList.add('active');
  updateProgressBar();
}

function prevStep(step) {
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep = step;
  document.getElementById(`step-${currentStep}`).classList.add('active');
  updateProgressBar();
}

function updateProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  
  // A barra só aparece nas etapas de perguntas (1 a 6)
  if (currentStep >= 1 && currentStep <= 6) {
    progressBar.style.display = 'flex';
    const bars = progressBar.querySelectorAll('.bar');
    
    bars.forEach((bar, idx) => {
      if (idx < currentStep) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    });
  } else {
    progressBar.style.display = 'none';
  }
}

// ==========================================
// 4. INTERAÇÃO E VALIDAÇÃO DOS CARDS
// ==========================================
document.querySelectorAll('.option-card').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-key');
    const val = card.getAttribute('data-val');
    
    // Encontra o container pai para desmarcar apenas os irmãos (não afeta outras etapas)
    const parentContainer = card.closest('.grid-options');
    parentContainer.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    
    // Marca o clicado e salva no estado
    card.classList.add('selected');
    answers[key] = val;

    // Se a opção selecionada for um dia (etapa 6), limpa o calendário customizado
    if (key === 'dia') {
      document.getElementById('custom-date-input').value = '';
    }

    // Libera o botão "Próximo" (ou "Enviar") da etapa atual
    const stepDiv = card.closest('.step');
    const btnNext = stepDiv.querySelector('.btn-next');
    if (btnNext) {
      btnNext.disabled = false;
    }
  });
});

// ==========================================
// 5. SLIDER DE ANIMAÇÃO E TEXTAREA
// ==========================================
const rangeInput = document.getElementById('animacao-range');
const rangeVal = document.getElementById('slider-val');

rangeInput.addEventListener('input', (e) => {
  rangeVal.innerText = e.target.value;
  answers.animacao = e.target.value;
});

const textarea = document.getElementById('pedido-text');
const charCounter = document.getElementById('char-counter');

textarea.addEventListener('input', (e) => {
  charCounter.innerText = `${e.target.value.length}/100`;
  answers.pedido = e.target.value;
});

// ==========================================
// 6. VALIDAÇÃO E GERAÇÃO DINÂMICA DE DATAS
// ==========================================
const customDate = document.getElementById('custom-date-input');

// Trava o calendário para não permitir selecionar datas passadas
const todayISO = new Date().toISOString().split('T')[0];
customDate.min = todayISO;

customDate.addEventListener('change', (e) => {
  answers.dia = e.target.value;
  
  // Ao digitar uma data, desmarca as opções de dias fixos acima
  document.querySelectorAll('#dates-container .option-card').forEach(c => c.classList.remove('selected'));

  const btnFinal = document.getElementById('btn-finalizar');
  btnFinal.disabled = !e.target.value;
});

// Função que calcula a próxima Sexta, Sábado e Domingo dinamicamente
function generateDynamicDates() {
  const container = document.getElementById('dates-container');
  if (!container) return;

  const today = new Date();
  
  // Retorna a próxima ocorrência do dia especificado (0=Dom, 5=Sex, 6=Sáb)
  function getNextDay(targetDay) {
    const d = new Date(today);
    let diff = targetDay - d.getDay();
    if (diff <= 0) diff += 7; // Garante que pegará sempre a próxima data futura
    d.setDate(d.getDate() + diff);
    return d;
  }

  // Gera as datas para Sexta, Sábado e Domingo
  const upcomingDates = [
    getNextDay(5), // Sexta-feira
    getNextDay(6), // Sábado
    getNextDay(0)  // Domingo
  ];

  container.innerHTML = '';

  upcomingDates.forEach(date => {
    // Formata no padrão: "sexta-feira, 14 de agosto de 2026"
    const formattedDate = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const button = document.createElement('button');
    button.className = 'option-card';
    button.setAttribute('data-key', 'dia');
    button.setAttribute('data-val', formattedDate);
    button.textContent = formattedDate;

    // Adiciona evento de seleção ao botão gerado
    button.addEventListener('click', () => {
      container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      button.classList.add('selected');
      answers.dia = formattedDate;

      // Limpa o input de data customizada
      customDate.value = '';

      // Libera o botão "Enviar"
      document.getElementById('btn-finalizar').disabled = false;
    });

    container.appendChild(button);
  });
}

// Executa a geração automática assim que o script é carregado
generateDynamicDates();

// ==========================================
// 7. SUBMISSÃO SILENCIOSA (GOOGLE FORMS)
// ==========================================
async function finishForm() {
  // 1. Esconde as perguntas e mostra a tela final imediatamente
  nextStep(7);

  // 2. URL final de resposta gerada a partir do seu link
  const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSeUrUuJRsG3G3p5ikWNevw31ZJEkljPWQOL4Vqc9ZrrjykeqQ/formResponse";
  
  const formData = new URLSearchParams();
  
  // 3. Mapeamento com os IDs reais do seu formulário
  formData.append('entry.40976395', answers.tipo || 'Me surpreenda');       // Tipo de Encontro (p1)
  formData.append('entry.485862482', answers.roupa || 'Me surpreenda');     // Estilo de Roupa (p2)
  formData.append('entry.200038362', answers.transporte || 'A combinar');   // Transporte (p3)
  formData.append('entry.1216742022', `${answers.animacao}/10`);           // Nível de Animação (p4)
  formData.append('entry.56458101', answers.pedido || 'Nenhum');            // Pedido Especial (p5)
  formData.append('entry.2125032026', answers.dia || 'A combinar');          // Dia Escolhido (p6)

  // 4. Disparo invisível (Background Fetch)
  try {
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
  } catch (error) {
    console.error('Erro invisível ao registrar resposta:', error);
  }
}