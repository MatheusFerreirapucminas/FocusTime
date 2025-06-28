document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const btnCriar = document.querySelector('.btn-criar');
    const dificuldades = document.querySelectorAll('.dificuldade');
    const vidaBar = document.querySelector('.vida span');
    const xpBar = document.querySelector('.xp span');

    // Variáveis
    let dificuldadeSelecionada = null;
    let tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];
    const xpPorDificuldade = {
        'fácil': 5,
        'médio': 15,
        'difícil': 45
    };

    atualizarListasTarefas();
    configurarNavegacaoAbas();

    dificuldades.forEach(dif => {
        dif.addEventListener('click', selecionarDificuldade);
    });

    btnCriar.addEventListener('click', criarTarefa);

    function selecionarDificuldade(e) {
        dificuldades.forEach(d => {
            d.classList.remove('selecionada');
        });

        e.currentTarget.classList.add('selecionada');
        dificuldadeSelecionada = e.currentTarget.getAttribute('data-dificuldade');
    }

    async function criarTarefa() {
        const titulo = document.getElementById('titulo').value;
        const descricao = document.getElementById('descricao').value;
        const data = document.getElementById('data').value;

        if (!titulo || !descricao || !data || !dificuldadeSelecionada) {
            mostrarNotificacao('Preencha todos os campos!', 'erro');
            return;
        }

        const novaTarefa = { titulo, descricao, data, dificuldade: dificuldadeSelecionada };

        try {
            console.log("Tarefa sendo enviada:", novaTarefa);
            const resposta = await fetch('https://focustime-9z8f.onrender.com/tarefa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaTarefa)
            });

            if (!resposta.ok) {
                const erro = await resposta.text();
                console.error("Resposta do servidor:", erro);
                throw new Error('Erro ao criar tarefa');
            }

            mostrarNotificacao('Tarefa criada com sucesso!', 'sucesso');
            atualizarListasTarefas();
            limparFormulario();
        } catch (erro) {
            mostrarNotificacao('Erro ao criar tarefa. Veja o console.', 'erro');
            console.error("Erro POST:", erro);
        }
    }


    async function concluirTarefa(e) {
        const id = e.target.getAttribute('data-id');

        try {
            const res = await fetch(`https://focustime-9z8f.onrender.com/tarefa/${id}`);

            if (!res.ok) throw new Error("Tarefa não encontrada no servidor.");

            const tarefa = await res.json();

            const deleteRes = await fetch(`https://focustime-9z8f.onrender.com/tarefa/${id}`, {
                method: 'DELETE'
            });

            if (!deleteRes.ok) throw new Error("Erro ao deletar tarefa no servidor.");

            const tarefaConcluida = {
                ...tarefa,
                id: Date.now(),
                concluida: true
            };

            const concluidas = JSON.parse(localStorage.getItem('tarefasConcluidas')) || [];
            concluidas.push(tarefaConcluida);
            localStorage.setItem('tarefasConcluidas', JSON.stringify(concluidas));

            const xpGanho = xpPorDificuldade[tarefa.dificuldade];
            mostrarNotificacao(`Tarefa concluída! +${xpGanho}XP`, 'sucesso');
            atualizarProgresso(xpGanho);
            atualizarListasTarefas();
        } catch (error) {
            mostrarNotificacao('Erro ao concluir tarefa.', 'erro');
            console.error('Erro:', error);
        }
    }

    function atualizarListasTarefas() {
        atualizarListaTarefasAtivas();
        atualizarListaTarefasConcluidas();
    }

    async function atualizarListaTarefasAtivas() {
        const lista = document.getElementById('listaTarefasAtivas');
        lista.innerHTML = '';

        try {
            const resposta = await fetch('https://focustime-9z8f.onrender.com/tarefa');
            const tarefasAtivas = await resposta.json();

            if (tarefasAtivas.length === 0) {
                lista.innerHTML = '<p class="sem-tarefas">Nenhuma tarefa ativa.</p>';
                return;
            }

            tarefasAtivas.forEach(tarefa => {
                const card = document.createElement('div');
                card.className = 'tarefa-card';
                card.innerHTML = `
    <h3>${tarefa.titulo}</h3>
    <p>${tarefa.descricao}</p>
    <small>Data: ${formatarData(tarefa.data)}</small>
    <div class="dificuldade-tag ${tarefa.dificuldade}">${tarefa.dificuldade.toUpperCase()}</div>
    <button class="btn-concluir" data-id="${tarefa.id}">Concluir</button>
    `;
                lista.appendChild(card);
            });

            document.querySelectorAll('.btn-concluir').forEach(btn => {
                btn.addEventListener('click', concluirTarefa);
            });

        } catch (error) {
            mostrarNotificacao('Erro ao carregar tarefas ativas.', 'erro');
            console.error(error);
        }
    }

    function atualizarListaTarefasConcluidas() {
        const lista = document.getElementById('listaTarefasConcluidas');
        lista.innerHTML = '';

        const tarefasConcluidas = JSON.parse(localStorage.getItem('tarefasConcluidas')) || [];

        if (tarefasConcluidas.length === 0) {
            lista.innerHTML = '<p class="sem-tarefas">Nenhuma tarefa concluída ainda.</p>';
            return;
        }

        tarefasConcluidas.forEach(tarefa => {
            const card = document.createElement('div');
            card.className = 'tarefa-card tarefa-concluida';
            card.innerHTML = `
    <h3>${tarefa.titulo}</h3>
    <p>${tarefa.descricao}</p>
    <small>Data: ${formatarData(tarefa.data)}</small>
    <div class="dificuldade-tag ${tarefa.dificuldade}">${tarefa.dificuldade.toUpperCase()}</div>
    <button class="btn-excluir" data-id="${tarefa.id}">Excluir</button>
    `;
            lista.appendChild(card);
        });

        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', excluirTarefaConcluida);
        });
    }

    function excluirTarefaConcluida(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        let concluidas = JSON.parse(localStorage.getItem('tarefasConcluidas')) || [];
        concluidas = concluidas.filter(t => t.id !== id);
        localStorage.setItem('tarefasConcluidas', JSON.stringify(concluidas));
        mostrarNotificacao('Tarefa excluída permanentemente!', 'sucesso');
        atualizarListasTarefas();
    }


    function removerTarefa(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        tarefas = tarefas.filter(tarefa => tarefa.id !== id);
        salvarTarefas();
        mostrarNotificacao('Tarefa removida!', 'sucesso');
        atualizarListasTarefas();
    }

    function salvarTarefas() {
        localStorage.setItem('tarefas', JSON.stringify(tarefas));
    }

    function formatarData(dataString) {
        const [ano, mes, dia] = dataString.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    function atualizarProgresso(xpGanho = 0) {
        const xpAtual = parseInt(xpBar.style.width) || 0;
        const novoXp = Math.min(xpAtual + xpGanho, 100);
        xpBar.style.width = `${novoXp}%`;

        if (novoXp >= 100) {
            xpBar.style.width = '0%';
            vidaBar.style.width = '100%';
            setTimeout(() => {
                vidaBar.style.width = '80%';
                mostrarNotificacao('Level Up!', 'sucesso');
            }, 1000);
        }
    }

    function limparFormulario() {
        document.getElementById('titulo').value = '';
        document.getElementById('descricao').value = '';
        document.getElementById('data').value = '';
        dificuldades.forEach(d => {
            d.classList.remove('selecionada');
        });
        dificuldadeSelecionada = null;
    }

    function configurarNavegacaoAbas() {
        document.querySelectorAll('.aba-conteudo').forEach(aba => {
            aba.classList.remove('active');
        });
        document.getElementById('criar-aba').classList.add('active');

        document.querySelectorAll('.aba-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.aba-conteudo').forEach(aba => {
                    aba.classList.remove('active');
                });

                const abaAlvo = this.dataset.aba;
                document.getElementById(`${abaAlvo}-aba`).classList.add('active');
            });
        });
    }

    function mostrarNotificacao(mensagem, tipo) {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        document.body.appendChild(notificacao);

        setTimeout(() => {
            notificacao.classList.add('show');
        }, 10);

        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notificacao);
            }, 300);
        }, 3000);
    }
});