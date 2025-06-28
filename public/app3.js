document.addEventListener("DOMContentLoaded", function () {

    let diaSelecionado = null;
    let mesSelecionado = null;
    let anoSelecionado = null;

    const tituloInput = document.getElementById("titulo");
    const horarioInput = document.getElementById("horario");
    const calendario = document.getElementById("calendario");
    const mesAno = document.getElementById("mesAno");
    const API_URL = "https://focustime-gk06.onrender.com/eventos";

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    let dataAtual = new Date();

    function desenharCalendario(data) {
        calendario.innerHTML = "";
        const ano = data.getFullYear();
        const mes = data.getMonth();
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

        mesAno.textContent = `${meses[mes]} de ${ano}`;
        const tabela = document.createElement("table");
        const linhaCabecalho = document.createElement("tr");
        ["Do", "Se", "Te", "Qa", "Qi", "Se", "Sa"].forEach(dia => {
            const th = document.createElement("th");
            th.innerText = dia;
            linhaCabecalho.appendChild(th);
        });
        tabela.appendChild(linhaCabecalho);

        let linha = document.createElement("tr");
        for (let i = 0; i < primeiroDiaSemana; i++) {
            linha.appendChild(document.createElement("td"));
        }

        for (let diaMes = 1; diaMes <= ultimoDiaMes; diaMes++) {
            if ((linha.children.length) % 7 === 0 && diaMes !== 1) {
                tabela.appendChild(linha);
                linha = document.createElement("tr");
            }
            const celula = document.createElement("td");
            celula.innerText = diaMes;
            celula.style.cursor = "pointer";

            const hoje = new Date();
            if (
                diaMes === hoje.getDate() &&
                mes === hoje.getMonth() &&
                ano === hoje.getFullYear()
            ) {
                celula.style.backgroundColor = "#ffcc99";
            }


            celula.addEventListener("click", () => {
                diaSelecionado = diaMes;
                mesSelecionado = mes + 1;
                anoSelecionado = ano;

                document.querySelectorAll("td").forEach(td => td.style.backgroundColor = "");

                if (
                    dataAtual.getDate() === new Date().getDate() &&
                    dataAtual.getMonth() === new Date().getMonth() &&
                    dataAtual.getFullYear() === new Date().getFullYear()
                ) {
                    const todasAsCelulas = calendario.querySelectorAll("td");
                    todasAsCelulas.forEach((td) => {
                        if (parseInt(td.innerText) === new Date().getDate()) {
                            td.style.backgroundColor = "#ffcc99";
                        }
                    });
                }

                celula.style.backgroundColor = "#ffbfa4";
            });


            if (
                id &&
                diaMes === diaSelecionado &&
                mes + 1 === mesSelecionado &&
                ano === anoSelecionado
            ) {
                celula.style.backgroundColor = "#ffbfa4";
            }

            linha.appendChild(celula);
        }

        tabela.appendChild(linha);
        calendario.appendChild(tabela);
    }

    desenharCalendario(dataAtual);

    document.getElementById("anterior").addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        desenharCalendario(dataAtual);
    });

    document.getElementById("proximo").addEventListener("click", () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        desenharCalendario(dataAtual);
    });


    if (id) {
        fetch(`${API_URL}/${id}`)
            .then(res => res.json())
            .then(evento => {
                tituloInput.value = evento.titulo;
                horarioInput.value = evento.horario;

                diaSelecionado = evento.dia;
                mesSelecionado = evento.mes;
                anoSelecionado = evento.ano;

                dataAtual = new Date(evento.ano, evento.mes - 1);
                desenharCalendario(dataAtual);
            })
            .catch(err => {
                console.error("Erro ao carregar evento:", err);
                alert("❌ Erro ao carregar dados do evento para edição.");
            });
    }

    document.getElementById("botaoSalvar").addEventListener("click", (e) => {
        e.preventDefault();
        const titulo = tituloInput.value;
        const horario = horarioInput.value;

        if (!diaSelecionado || !titulo || !horario) {
            alert("Por favor, selecione um dia e preencha título e horário!");
            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataSelecionada = new Date(anoSelecionado, mesSelecionado - 1, diaSelecionado);

        if (dataSelecionada < hoje) {
            alert("❌ Não é possível criar eventos em datas passadas.");
            return;
        }

        if (dataSelecionada.getTime() === hoje.getTime()) {
            const agora = new Date();
            const [horaSelecionada, minutoSelecionado] = horario.split(":").map(Number);
            if (minutoSelecionado > 59) {
                alert("❌ Os minutos devem estar entre 00 e 59.");
                return;
            }
            const horaEvento = new Date(anoSelecionado, mesSelecionado - 1, diaSelecionado, horaSelecionada, minutoSelecionado);

            if (horaEvento <= agora) {
                alert("❌ Não é possível criar eventos para horários que já passaram.");
                return;
            }
        }

        const evento = {
            dia: diaSelecionado,
            mes: mesSelecionado,
            ano: anoSelecionado,
            titulo,
            horario
        };

        const url = id ? `${API_URL}/${id}` : API_URL;
        const method = id ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evento)
        })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(() => {
                alert(id ? "✅ Evento atualizado!" : "✅ Evento salvo com sucesso!");
                window.location.href = "agenda.html";
            })
            .catch(() => {
                alert("❌ Falha ao salvar o evento.");
            });
    });
});

const eventosContainer = document.getElementById("eventosContainer");
const verTodosBtn = document.getElementById("verTodosBtn");
let mostrandoTodos = false;


const API_URL = "https://focustime-gk06.onrender.com/eventos";

function carregarEventos() {
    eventosContainer.innerHTML = "";

    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao buscar os eventos");
            }
            return response.json();
        })
        .then(eventosSalvos => {
            const hoje = new Date();

            const eventosFiltrados = eventosSalvos.filter((evento) => {
                const eventoData = new Date(
                    `${evento.ano}-${String(evento.mes).padStart(2, "0")}-${String(
                        evento.dia
                    ).padStart(2, "0")}T${evento.horario}`
                );
                return (
                    mostrandoTodos ||
                    (evento.dia == hoje.getDate() &&
                        evento.mes == hoje.getMonth() + 1 &&
                        evento.ano == hoje.getFullYear())
                );
            });

            eventosFiltrados.sort((a, b) => {
                const dataA = new Date(
                    `${a.ano}-${String(a.mes).padStart(2, "0")}-${String(
                        a.dia
                    ).padStart(2, "0")}T${a.horario}`
                );
                const dataB = new Date(
                    `${b.ano}-${String(b.mes).padStart(2, "0")}-${String(
                        b.dia
                    ).padStart(2, "0")}T${b.horario}`
                );
                return dataA - dataB;
            });

            if (eventosFiltrados.length > 0) {
                eventosFiltrados.forEach((evento) => {
                    const dataFormatada = `${String(evento.dia).padStart(2, "0")}/${String(evento.mes).padStart(2, "0")}/${evento.ano}`;
                    const divEvento = document.createElement("div");
                    divEvento.classList.add("evento");

                    divEvento.innerHTML = `
            <h2>${evento.titulo}</h2>
            <div class="data">Data: ${dataFormatada}</div>
            <div class="horario">Horário: ${evento.horario}</div>
            <button class="editar-btn" data-id="${evento.id}">Editar</button>
            <button class="apagar-btn" data-id="${evento.id}">Apagar</button>
        `;

                    eventosContainer.appendChild(divEvento);
                });

                document.querySelectorAll(".apagar-btn").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-id");
                        const confirmacao = confirm(
                            "Tem certeza que deseja apagar este evento?"
                        );
                        if (confirmacao) {
                            apagarEvento(id);
                        }
                    });
                });
                document.querySelectorAll(".editar-btn").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-id");
                        window.location.href = `CriarEvento.html?id=${id}`;
                    });
                });
            } else {
                const semEventos = document.createElement("div");
                semEventos.classList.add("no-eventos");
                semEventos.textContent = "Nenhum evento encontrado.";
                eventosContainer.appendChild(semEventos);
            }
        })
        .catch(error => {
            console.error("Erro ao carregar eventos:", error);
            eventosContainer.innerHTML = "<div class='no-eventos'>Erro ao carregar eventos.</div>";
        });
}


function apagarEvento(id) {
    fetch(`${API_URL}/${id}`, {
        method: "DELETE",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao apagar evento");
            }
            carregarEventos();
        })
        .catch(error => {
            console.error("Erro ao apagar evento:", error);
            alert("❌ Erro ao apagar o evento.");
        });
}


verTodosBtn.addEventListener("click", () => {
    mostrandoTodos = !mostrandoTodos;

    if (mostrandoTodos) {
        verTodosBtn.textContent = "Ver Apenas Hoje";
    } else {
        verTodosBtn.textContent = "Ver Todos os Eventos";
    }

    carregarEventos();
});
carregarEventos();