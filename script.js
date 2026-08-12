document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastro-form');
  const whatsappInput = document.getElementById('whatsapp');
  const cepInput = document.getElementById('cep');
  const idadeInput = document.getElementById('idade'); // CORREÇÃO: referência adicionada para o filtro de dígitos
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
    checkFormValidity();
  });

  // 3.1 CORREÇÃO: filtro de dígitos para Idade (impede "e", "+", "-", "." em type="number",
  // que passariam despercebidos e só seriam barrados na validação nativa sem feedback claro)
  idadeInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value.length > 3) value = value.slice(0, 3); // idade máx. é 120 -> 3 dígitos
    e.target.value = value;
    checkFormValidity();
  });

  // 3.2 Função para buscar o CEP na API (ViaCEP)
async function buscarEndereco(cep) {
  // Remove qualquer caractere que não seja número
  const cepLimpo = cep.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    // CORREÇÃO: feedback quando o usuário sai do campo com um CEP incompleto
    // (antes falhava silenciosamente, sem nenhum aviso)
    if (cepLimpo.length > 0) {
      alert('CEP incompleto. Digite os 8 dígitos para buscar o endereço automaticamente.');
    }
    return; // CEP incompleto ou vazio, não faz a busca
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    if (!data.erro) {
      // Preenche os campos se encontrar o endereço
      document.getElementById('endereco').value = data.logradouro;
      document.getElementById('bairro').value = data.bairro;

      // CORREÇÃO: sincroniza o estado visual do botão após o preenchimento automático.
      // Atribuições via JS (.value = ...) NÃO disparam o evento "input" do formulário,
      // então checkFormValidity() nunca era chamado depois do autofill.
      checkFormValidity();

      // Opcional: Se quiser dar foco no campo seguinte (ex: número da casa)
      // document.getElementById('numero').focus(); 
    } else {
      alert("CEP não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
  }
}

// Adiciona o ouvinte de evento no campo CEP
cepInput.addEventListener('blur', (e) => {
  buscarEndereco(e.target.value);
});

  // 4. Ativação visual do botão quando campos obrigatórios estiverem preenchidos
  // (mantido apenas como controle VISUAL da classe .active; o bloqueio real do
  // submit para o campo Sexo agora está no submit handler, item 5 abaixo)
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

    // CORREÇÃO: bloqueio REAL do envio quando "Sexo" não foi selecionado.
    // Antes, checkFormValidity() só controlava a classe ".active" (visual);
    // o botão continuava clicável e o form era enviado mesmo com sexo: "".
    // Como o input é type="hidden", o navegador nunca valida isso sozinho.
    if (!sexoHiddenInput.value) {
      alert('Por favor, selecione o Sexo antes de continuar.');
      return;
    }

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
        // Se o status for 409 (Conflict), significa que o WhatsApp já existe na base
        if (response.status === 409) {
          throw new Error('WHATSAPP_DUPLICADO');
        }
        throw new Error('ERRO_BANCO');
      }

      // Esconde o formulário e o header para evitar novos envios
      const formHeader = document.querySelector('.form-header');
      if (formHeader) formHeader.style.display = 'none';
      form.style.display = 'none';

      // Mostra a tela de sucesso estilizada
      const successScreen = document.getElementById('success-screen');
      if (successScreen) successScreen.style.display = 'flex';

    } catch (error) {
      console.error('Erro:', error);

      // Mensagens customizadas de acordo com o tipo de erro
      if (error.message === 'WHATSAPP_DUPLICADO') {
        alert('Este número de WhatsApp já está cadastrado!');
      } else if (error.message === 'ERRO_BANCO') {
        alert('Não foi possível salvar o seu cadastro. Tente novamente.');
      } else {
        alert('Ops! Falha de conexão. Verifique sua internet e tente novamente.');
      }

      // Restaura o botão caso dê erro
      submitBtn.disabled = false;
      submitBtn.innerText = 'Concluir e Ver Conteúdos';
      submitBtn.style.opacity = '1';
    }
  });
});