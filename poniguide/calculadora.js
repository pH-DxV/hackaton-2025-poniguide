// --- CONSTANTES DE CÁLCULO (Otimizadas para Tilápia e Alface) ---

// Fórmula 1 (da Imagem): 20 kg para cada 1.000 L
const DENSIDADE_BIOMASSA_KG_POR_L = 20 / 1000; // = 0.02

// Fórmula 2 (Peso de Abate): AGORA É INPUT DO USUÁRIO

// Fórmula 3 (Nova Regra): 200 L para cada 1 m²
const LITROS_POR_METRO_QUADRADO = 200;

// Fórmula 4 (Referência de Inserção): 500g
const PESO_INICIAL_ALEVINO_KG = 0.5;

const RACAO_FATOR_DIARIO_POR_PESO = 0.015; // Ração (Tilápia): 1.5% do peso vivo
const CUSTO_RACAO_KG = 5.0; // Custo médio


let balanceChart = null;

function exibirErro(mensagem) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = mensagem;
    errorElement.style.display = 'block';
}

function ocultarErro() {
    document.getElementById('error-message').style.display = 'none';
}

function calcular() {
    ocultarErro();

    const volumeInput = document.getElementById('volume').value.replace(',', '.');
    const pesoFinalInput = document.getElementById('peso-final').value.replace(',', '.');
    const areaPlantioInput = document.getElementById('area-plantio-input').value.replace(',', '.');
    const pesoAbateInput = document.getElementById('peso-abate').value.replace(',', '.');
    const phInput = document.getElementById('ph-input').value.replace(',', '.');

    let volumeL = volumeInput ? parseFloat(volumeInput) : 0;
    let pesoFinalKg = pesoFinalInput ? parseFloat(pesoFinalInput) : 0;
    let areaPlantioM2 = areaPlantioInput ? parseFloat(areaPlantioInput) : 0;
    let pesoAbateKg = pesoAbateInput ? parseFloat(pesoAbateInput) : 0;
    let phValor = phInput ? parseFloat(phInput) : 0;


    let camposPreenchidos = 0;
    if (volumeL > 0) camposPreenchidos++;
    if (pesoFinalKg > 0) camposPreenchidos++;
    if (areaPlantioM2 > 0) camposPreenchidos++;

    if (pesoAbateKg <= 0) {
        exibirErro("Por favor, preencha o *Peso de Abate por Peixe (Kg)*. Este campo é obrigatório.");
        document.getElementById('results-card').style.display = 'none';
        return;
    }
    if (camposPreenchidos === 0) {
        exibirErro("Por favor, preencha *pelo menos um* dos três campos de sistema (Volume, Peso Total ou Área).");
        document.getElementById('results-card').style.display = 'none';
        return;
    }

    let resVolume;
    let resPesoFinal;
    let resAreaPlantio;
    let peixesMaximos;
    let resPesoInicial;
    let racaoKg;
    let custoDiario;
    let warningMessage = '';

    if (volumeL > 0) {
        resVolume = volumeL;
        resPesoFinal = resVolume * DENSIDADE_BIOMASSA_KG_POR_L;
        resAreaPlantio = resVolume / LITROS_POR_METRO_QUADRADO;

        if (camposPreenchidos > 1 && Math.abs(pesoFinalKg - resPesoFinal) > 1) {
            warningMessage += `Aviso: Seu volume de ${resVolume.toFixed(0)}L suporta ${resPesoFinal.toFixed(1)}kg (não ${pesoFinalKg.toFixed(1)}kg). `;
        }
        if (camposPreenchidos > 1 && Math.abs(areaPlantioM2 - resAreaPlantio) > 0.5) {
            warningMessage += `Aviso: Seu volume de ${resVolume.toFixed(0)}L suporta ${resAreaPlantio.toFixed(1)}m² (não ${areaPlantioM2.toFixed(1)}m²). `;
        }

    } else if (pesoFinalKg > 0) {
        resPesoFinal = pesoFinalKg;
        resVolume = resPesoFinal / DENSIDADE_BIOMASSA_KG_POR_L;
        resAreaPlantio = resVolume / LITROS_POR_METRO_QUADRADO;

        if (camposPreenchidos > 1 && Math.abs(areaPlantioM2 - resAreaPlantio) > 0.5) {
            warningMessage += `Aviso: Seu peso de ${resPesoFinal.toFixed(1)}kg exige ${resAreaPlantio.toFixed(1)}m² (não ${areaPlantioM2.toFixed(1)}m²). `;
        }

    } else if (areaPlantioM2 > 0) {
        resAreaPlantio = areaPlantioM2;
        resVolume = resAreaPlantio * LITROS_POR_METRO_QUADRADO;
        resPesoFinal = resVolume * DENSIDADE_BIOMASSA_KG_POR_L;
    }

    racaoKg = resPesoFinal * RACAO_FATOR_DIARIO_POR_PESO;
    custoDiario = racaoKg * CUSTO_RACAO_KG;
    peixesMaximos = Math.floor(resPesoFinal / pesoAbateKg);
    resPesoInicial = peixesMaximos * PESO_INICIAL_ALEVINO_KG;

    document.getElementById('res-peixes').textContent = peixesMaximos;
    document.getElementById('res-peso-inicial').textContent = resPesoInicial.toFixed(2) + ' kg';
    document.getElementById('res-volume').textContent = resVolume.toFixed(0) + ' L';
    document.getElementById('res-plantio').textContent = resAreaPlantio.toFixed(1) + ' m²';
    document.getElementById('res-peso-final').textContent = resPesoFinal.toFixed(2) + ' kg';
    document.getElementById('res-racao-kg').textContent = racaoKg.toFixed(2) + ' kg';
    document.getElementById('res-custo').textContent = 'R$ ' + custoDiario.toFixed(2);

    const phStatusEl = document.getElementById('res-ph-status');
    const phContainerEl = document.getElementById('res-ph-container');

    if (phValor > 0) {
        let status = '';
        let cor = '';
        if (phValor < 6.0) {
            status = 'Muito Ácido (Perigo)';
            cor = 'var(--cor-erro)';
        } else if (phValor < 6.4) {
            status = 'Ácido (Ideal p/ Plantas)';
            cor = '#e67e22';
        } else if (phValor <= 7.0) {
            status = 'Ideal (Bom p/ Peixes e Bactérias)';
            cor = 'var(--cor-logo-clara)';
        } else if (phValor <= 7.6) {
            status = 'Alcalino (Atenção)';
            cor = '#e67e22';
        } else {
            status = 'Muito Alcalino (Perigo)';
            cor = 'var(--cor-erro)';
        }
        phStatusEl.textContent = status;
        phStatusEl.style.color = cor;
        phContainerEl.style.display = 'flex';
    } else {
        phContainerEl.style.display = 'none';
    }

    const alertElement = document.getElementById('results-alert-message');
    if (resPesoFinal > 0 && resAreaPlantio > 0 && resPesoInicial > 0) { // Verifica se resPesoInicial também é válido
        const startupRatio = resPesoInicial / resPesoFinal;
        const startupArea = resAreaPlantio * startupRatio;
        const startupPercent = (startupRatio * 100).toFixed(0);

        alertElement.innerHTML = `<strong>Aviso de Lote Novo:</strong> Seu sistema está dimensionado para o 'Peso Final' (${resPesoFinal.toFixed(1)}kg).
                                   Ao iniciar com o 'Peso Inicial' (${resPesoInicial.toFixed(1)}kg), suas plantas não terão nutrientes suficientes.
                                   <br><br><strong>Recomendação:</strong> Comece plantando apenas <strong>${startupArea.toFixed(1)}m²</strong>
                                   (cerca de ${startupPercent}%) da sua área total e aumente gradualmente à medida que os peixes crescem.`;
        alertElement.style.display = 'block'; // Garante que a mensagem seja exibida
    } else {
        alertElement.textContent = "Cálculo inicial inválido para gerar aviso de lote novo.";
        alertElement.style.display = 'block'; // Exibe mensagem de erro se cálculo inicial falhar
    }


    document.getElementById('results-card').style.display = 'block';

    atualizarGrafico(resAreaPlantio, racaoKg);

    if (warningMessage) {
        exibirErro(warningMessage);
        document.getElementById('error-message').style.color = 'var(--cor-erro)';
    } else {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').style.color = 'var(--cor-principal)';
        document.getElementById('error-message').textContent = `Cálculo de equilíbrio concluído com sucesso.`;
    }
}

function atualizarGrafico(plantio, racao) {
    const ctx = document.getElementById('balanceChart').getContext('2d');

    if (balanceChart) {
        balanceChart.destroy();
    }
    
    // Garante que não haja valores 0 ou negativos no gráfico
    const dadosPlantio = Math.max(plantio, 0.1); 
    const dadosRacao = Math.max(racao, 0.1);


    const data = {
        labels: ['Área de Plantio (m²)', 'Ração Diária (Kg)'],
        datasets: [{
            label: 'Dimensionamento do Sistema',
            data: [dadosPlantio, dadosRacao],
            backgroundColor: [
                '#34A89E',
                '#0D47A1' // Ajustado para usar variável CSS principal
            ],
            hoverOffset: 4
        }]
    };

    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Montserrat'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toFixed(1);
                                if (context.dataIndex === 0) label += ' m²';
                                if (context.dataIndex === 1) label += ' kg';
                            }
                            return label;
                        }
                    },
                    bodyFont: {
                        family: 'Montserrat'
                    }
                }
            }
        }
    };

    balanceChart = new Chart(ctx, config);
}

function salvarSistema() {
    const resPeixes = document.getElementById('res-peixes').textContent;
    if (!resPeixes || resPeixes === '0') {
        alert("Calcule um sistema primeiro antes de tentar salvar!");
        return;
    }

    const sistema = {
        id: Date.now(),
        nome: `Sistema ${new Date().toLocaleTimeString()}`,
        volumeTanqueLitros: parseFloat(document.getElementById('res-volume').textContent),
        areaCanteiroM2: parseFloat(document.getElementById('res-plantio').textContent),
        pesoAbateKg: parseFloat(document.getElementById('peso-abate').value),
        ultimaAtualizacao: new Date().toISOString().slice(0, 10)
    };

    const sistemasSalvos = JSON.parse(localStorage.getItem('sistemas')) || [];
    sistemasSalvos.push(sistema);
    localStorage.setItem('sistemas', JSON.stringify(sistemasSalvos));

    alert("Sistema salvo com sucesso!");
}

// Adiciona listeners aos botões
document.addEventListener('DOMContentLoaded', () => {
    const btnCalcular = document.getElementById('btn-calcular');
    const btnSalvar = document.getElementById('btn-salvar');

    if(btnCalcular) {
        btnCalcular.addEventListener('click', calcular);
    } else {
        console.error("Botão Calcular (ID: btn-calcular) não encontrado!");
    }

    if(btnSalvar) {
        btnSalvar.addEventListener('click', salvarSistema);
    } else {
         console.error("Botão Salvar (ID: btn-salvar) não encontrado!");
    }

    // Inicializa o gráfico vazio e limpa inputs
    atualizarGrafico(1, 1);
    document.getElementById('volume').value = '';
    document.getElementById('peso-final').value = '';
    document.getElementById('area-plantio-input').value = '';
    document.getElementById('ph-input').value = '';
    document.getElementById('peso-abate').value = '';
    document.getElementById('results-card').style.display = 'none';
});