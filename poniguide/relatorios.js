let systemsData = [];
let currentSystemToEdit = null;

const DENSIDADE_BIOMASSA_KG_POR_L = 20 / 1000; // = 0.02
const LITROS_POR_METRO_QUADRADO = 200;
const PESO_INICIAL_ALEVINO_KG = 0.5;
const RACAO_FATOR_DIARIO_POR_PESO = 0.015;
const CUSTO_RACAO_KG = 5.0;


function showFeedback(message, type = 'info') {
    const feedback = document.getElementById('feedback-message');
    feedback.textContent = message;
    feedback.className = `feedback-message feedback-${type}`; // Usa classes para estilo
    feedback.style.display = 'block';

    const loadingMessage = document.querySelector('.systems-list .loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }

    if (type !== 'info') {
        setTimeout(() => feedback.style.display = 'none', 5000);
    }
}

function showModalError(message) {
    const errorElement = document.getElementById('modal-error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function formatCurrency(value) {
    if (typeof value !== 'number') return 'R$ -';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatBRDate(isoDate) {
    if (!isoDate) return 'N/A';
    try {
        const date = new Date(isoDate + 'T00:00:00'); // Garante UTC
        return date.toLocaleDateString('pt-BR'); // Usa Intl para formatar DD/MM/YYYY
    } catch (e) {
        return isoDate; // Retorna original se falhar
    }
}


function openEditModal() {
    const systemIdStr = document.getElementById('report-detail-card').getAttribute('data-active-id');
    if (!systemIdStr) return; // Sai se não houver ID ativo

    const systemId = parseInt(systemIdStr);
    currentSystemToEdit = systemsData.find(sys => sys.id === systemId);

    if (!currentSystemToEdit) {
        showFeedback("Erro: Não foi possível carregar os dados para edição.", "error");
        return;
    }

    document.getElementById('modal-system-id').textContent = `(ID: ${currentSystemToEdit.id})`;
    document.getElementById('edit-system-id').value = currentSystemToEdit.id;
    document.getElementById('edit-nome').value = currentSystemToEdit.nome;
    document.getElementById('edit-volume').value = currentSystemToEdit.volumeTanqueLitros;
    document.getElementById('edit-area').value = currentSystemToEdit.areaCanteiroM2; // Usando areaCanteiroM2 se disponível
    document.getElementById('edit-peso-abate').value = currentSystemToEdit.pesoAbateKg;

    document.getElementById('edit-modal').style.display = 'block';
    document.getElementById('modal-error-message').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentSystemToEdit = null;
    document.getElementById('modal-error-message').style.display = 'none'; // Limpa erro ao fechar
}

function loadSystems() {
    showFeedback("Carregando seus sistemas...", 'info');
    document.getElementById('report-detail-card').style.display = 'none'; // Esconde detalhes ao recarregar

    setTimeout(() => {
       
        const armazenados = JSON.parse(localStorage.getItem('sistemas')) || [];
        systemsData = armazenados.length > 0 ? armazenados : [];

        renderSystemsList(systemsData);
        if (systemsData.length > 0) {
           showFeedback("Sistemas carregados. Clique em um para ver o relatório.", 'success');
        } else {
           showFeedback("Nenhum sistema encontrado.", 'info');
        }
    }, 1000);
}


function renderSystemsList(systems) {
    const listContainer = document.getElementById('systems-list');
    listContainer.innerHTML = '';

    if (!systems || systems.length === 0) {
        listContainer.innerHTML = '<div class="loading-message">Você não possui sistemas cadastrados.</div>';
        return;
    }

    systems.forEach(system => {
        const card = document.createElement('div');
        card.className = 'system-card';
        card.setAttribute('data-id', system.id);
        card.onclick = () => getReportDetails(system.id, system.nome, system.ultimaAtualizacao);

        card.innerHTML = `
            <div class="system-info">
                <h4>${system.nome || 'Sistema sem nome'} (ID: ${system.id})</h4>
                <p>Volume: ${system.volumeTanqueLitros || '-'} L | Área: ${system.areaCanteiroM2 || '-'} m² | Abate: ${system.pesoAbateKg || '-'} kg</p>
                <p>Última Ação: ${formatBRDate(system.ultimaAtualizacao)}</p>
            </div>
            <div class="system-actions">
                <button title="Excluir Sistema" onclick="event.stopPropagation(); deleteSystem(${system.id}, '${system.nome || 'Sistema sem nome'}')">
                    🗑️
                </button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function getReportDetails(systemId, systemName, updateDate) {
    showFeedback(`Gerando relatório para: ${systemName}...`, 'info');
    document.getElementById('report-detail-card').setAttribute('data-active-id', systemId);

    setTimeout(() => {
        const mockReport = {
            idSistema: systemId,
            nomeSistema: systemName,
            sugestoesOtimizacao: [
                "OTIMIZAÇÃO: Suas plantas estão com ótimo desempenho. Considere aumentar a densidade de peixes em 10% para maximizar a produção.",
                "OPORTUNIDADE: O pH está estável. Mantenha a checagem quinzenal.",
                "CUSTO: Tente buscar fornecedores com custo abaixo de R$ 4,50/kg de ração."
            ]
            // Dados financeiros removidos
        };

        renderReportDetails(mockReport, updateDate);
        showFeedback(`Relatório para ${systemName} carregado.`, 'success');
    }, 1500);
}

function renderReportDetails(report, updateDate) {
    const detailCard = document.getElementById('report-detail-card');

    document.getElementById('report-title').textContent = `Relatório de Desempenho: ${report.nomeSistema}`;
    document.getElementById('report-date').textContent = `Dados Atualizados em: ${formatBRDate(updateDate)}`;

    const systemId = report.idSistema;
    const system = systemsData.find(s => s.id === systemId);

    if (!system || !system.pesoAbateKg) {
        showFeedback("Erro: Dados do sistema incompletos. Edite o sistema e adicione o 'Peso de Abate'.", "error");
        detailCard.style.display = 'none'; // Esconde o card se der erro
        return;
    }

    const resVolume = system.volumeTanqueLitros;
    // Usa a área REAL do sistema se existir, senão calcula a ideal
    const resAreaPlantio = system.areaCanteiroM2 || (resVolume / LITROS_POR_METRO_QUADRADO);
    const resPesoFinal = resVolume * DENSIDADE_BIOMASSA_KG_POR_L;
    const peixesMaximos = Math.floor(resPesoFinal / system.pesoAbateKg);
    const resPesoInicial = peixesMaximos * PESO_INICIAL_ALEVINO_KG;

    document.getElementById('res-peso-final').textContent = resPesoFinal.toFixed(2) + ' kg';
    document.getElementById('res-peixes').textContent = peixesMaximos;
    document.getElementById('res-peso-inicial').textContent = resPesoInicial.toFixed(2) + ' kg';

    let avisoLoteNovo = '';
    if (resPesoFinal > 0 && resAreaPlantio > 0 && resPesoInicial > 0) {
        const startupRatio = resPesoInicial / resPesoFinal;
        const startupArea = resAreaPlantio * startupRatio;
        const startupPercent = (startupRatio * 100).toFixed(0);

        avisoLoteNovo = `<strong>AVISO DE LOTE NOVO:</strong> Seu sistema suporta ${resAreaPlantio.toFixed(1)}m² de plantas no equilíbrio.
                         Ao iniciar com peixes novos (${resPesoInicial.toFixed(1)}kg),
                         <strong>comece plantando apenas ${startupArea.toFixed(1)}m² (${startupPercent}%)</strong>
                         e aumente gradualmente.`;
    }

    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';

    if (avisoLoteNovo) {
        const liAviso = document.createElement('li');
        liAviso.innerHTML = avisoLoteNovo;
        liAviso.classList.add('suggestion-warning'); // Adiciona classe para estilo
        suggestionsList.appendChild(liAviso);
    }

    report.sugestoesOtimizacao.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
    });

    detailCard.style.display = 'block';
}

function deleteSystem(systemId, systemName) {
    if (confirm(`Tem certeza que deseja EXCLUIR o sistema "${systemName}" (ID: ${systemId})? Esta ação é irreversível.`)) {

        showFeedback(`Excluindo sistema ${systemId}...`, 'info');

        setTimeout(() => {
            systemsData = systemsData.filter(sys => sys.id !== systemId);
            renderSystemsList(systemsData);
            document.getElementById('report-detail-card').style.display = 'none';
            showFeedback(`Sistema ${systemName} excluído com sucesso.`, 'success');
        }, 1000);
    }
}

function goToCalculator() {
    window.location.href = 'calculadora.html';
}

function salvarEdicao(event) {
    event.preventDefault();

    const nome = document.getElementById('edit-nome').value.trim();
    const volumeStr = document.getElementById('edit-volume').value.replace(',', '.');
    // USA A ÁREA DO CANTEIRO DO MODAL
    const areaStr = document.getElementById('edit-area').value.replace(',', '.');
    const pesoAbateStr = document.getElementById('edit-peso-abate').value.replace(',', '.');

    const id = parseInt(document.getElementById('edit-system-id').value);
    const volume = parseFloat(volumeStr);
    const area = parseFloat(areaStr);
    const pesoAbate = parseFloat(pesoAbateStr);

    if (!nome || isNaN(volume) || volume <= 0 || isNaN(area) || area <= 0 || isNaN(pesoAbate) || pesoAbate <= 0) {
        showModalError("Por favor, preencha todos os campos com valores válidos. O Peso de Abate é obrigatório.");
        return;
    }

    showFeedback(`Tentando salvar alterações para o sistema ${id}...`, 'info');
    document.getElementById('modal-error-message').style.display = 'none';

    setTimeout(() => {
        const index = systemsData.findIndex(sys => sys.id === id);
        if (index !== -1) {
            systemsData[index].nome = nome;
            systemsData[index].volumeTanqueLitros = volume;
            systemsData[index].areaCanteiroM2 = area; // Salva a área editada
            systemsData[index].pesoAbateKg = pesoAbate;
            systemsData[index].ultimaAtualizacao = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        }

        renderSystemsList(systemsData);
        closeEditModal();

        // Re-renderiza detalhes SE o sistema editado estava sendo exibido
        if (document.getElementById('report-detail-card').getAttribute('data-active-id') === id.toString()) {
            getReportDetails(id, nome, systemsData[index].ultimaAtualizacao);
        }

        showFeedback(`Sistema "${nome}" (ID: ${id}) alterado com sucesso!`, 'success');
    }, 1500);
}


document.addEventListener('DOMContentLoaded', () => {
    loadSystems();
    document.getElementById('edit-system-form').addEventListener('submit', salvarEdicao);

    // Fecha modal ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('edit-modal');
        if (event.target == modal) {
            closeEditModal();
        }
    }
});