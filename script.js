document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastro-form');
  const whatsappInput = document.getElementById('whatsapp');
  const cepInput = document.getElementById('cep');
  const pillBtns = document.querySelectorAll('.pill-btn');
  const sexoHiddenInput = document.getElementById('sexo');
  const submitBtn = document.querySelector('.btn-submit');

  // 1. Seletor dos botões de Sexo
  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pillBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      sexoHiddenInput.value = btn.getAttribute('data-value');
      checkFormValidity();
    });
  });

  // 2. Máscara automática de WhatsApp: (XX) XXXXX-XXXX
  whatsappInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    e.target.value = value;
    checkFormValidity();
  });

  // 3. Máscara automática de CEP: XXXXX-XXX
  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    e.target.value = value;
  });

  // 4. Ativação visual do botão quando campos obrigatórios estiverem preenchidos
  function checkFormValidity() {
    if (form.checkValidity() && sexoHiddenInput.value !== '') {
      submitBtn.classList.add('active');
    } else {
      submitBtn.classList.remove('active');
    }
  }

  form.addEventListener('input', checkFormValidity);

// 5. Envio dos Dados para o Supabase
  const SUPABASE_URL = 'https://uefzlaahnukrqmlgkbgv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lsDwZIB1_VtgzMU9d3Uv9Q_U_ceLqei';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Trava o botão para evitar envio duplo
    submitBtn.disabled = true;
    submitBtn.innerText = 'Enviando...';
    submitBtn.style.opacity = '0.7';

    const formData = {
      nome: document.getElementById('nome').value,
      whatsapp: whatsappInput.value,
      idade: parseInt(document.getElementById('idade').value),
      sexo: sexoHiddenInput.value,
      endereco: document.getElementById('endereco').value,
      bairro: document.getElementById('bairro').value,
      cep: cepInput.value
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/cadastros`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com o banco de dados.');
      }

      // --- ALTERAÇÃO AQUI ---
      // Esconde o formulário e o header para evitar novos envios
      const formHeader = document.querySelector('.form-header');
      if (formHeader) formHeader.style.display = 'none';
      form.style.display = 'none';

      // Mostra a tela de sucesso estilizada
      const successScreen = document.getElementById('success-screen');
      if (successScreen) successScreen.style.display = 'flex';

    } catch (error) {
      console.error('Erro:', error);
      alert('Ops! Tivemos um problema de conexão. Tente novamente em instantes.');
      // Restaura o botão caso dê erro
      submitBtn.disabled = false;
      submitBtn.innerText = 'Concluir e Ver Conteúdos';
      submitBtn.style.opacity = '1';
    }