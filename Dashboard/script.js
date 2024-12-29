// dashboard/script.js

/**
 * 1) Mapeia cada variável para um rótulo amigável.
 */
function getChartLabel(variable) {
  const labels = {
    // Exemplos de mapeamentos:
    'speed': 'Velocidade (km/h)',
    'oil_temp': 'Oil Temp (°C)',
    'beacon_code': 'Beacon Code',
    'lap_number': 'Lap Number',
    // Adicione as demais variáveis conforme seu transmitter.js/server.js
  };
  return labels[variable] || variable;
}

/**
 * 2) Define uma cor fixa para cada variável, se quiser diferenciá-las.
 */
function getFixedColor(variable) {
  const colors = {
    'speed': '#FF6384',
    'oil_temp': '#36A2EB',
    'beacon_code': '#FFCE56',
    // ...
  };
  return colors[variable] || '#FFFFFF';
}

/**
 * 3) Faz requisição ao endpoint e retorna o JSON (objeto).
 */
async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Erro HTTP! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados de ${endpoint}:`, error);
    return {};
  }
}

/**
 * 4) Filtra os dados para **somente** a volta atual e formata no padrão Chart.js.
 *    - Localiza a volta mais alta (maxLap)
 *    - Filtra os registros para lap_number == maxLap
 *    - Exibe somente esses pontos.
 */
function prepareChartData(data, key) {
  const arr = data[key];
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return null; // Sem dados para essa variável
  }

  // Acha a volta máxima
  const maxLap = Math.max(...arr.map(item => item.lap_number || 1));

  // Filtra somente a volta atual (maxLap)
  const arrFiltered = arr.filter(item => item.lap_number === maxLap);
  if (arrFiltered.length === 0) {
    return null;
  }

  // Opcionalmente, limita a 50 pontos
  const limitedData = arrFiltered.slice(-50);

  return {
    lapNumber: maxLap, // guardamos para usar no título do gráfico
    labels: limitedData.map(entry => {
      // Exibe hora local do navegador
      const d = new Date(entry.timestamp);
      return d.toLocaleTimeString();
    }),
    datasets: [{
      label: getChartLabel(key), // rótulo da variável
      data: limitedData.map(entry => entry[key] || 0),
      fill: false,
      borderColor: getFixedColor(key),
      tension: 0.1
    }]
  };
}

/**
 * 5) Cria um gráfico Chart.js com título incluindo "Volta X".
 */
function createChart(ctx, chartData, variableKey) {
  // Monta rótulo "Volta X - Nome da Variável"
  const voltaLabel = `Volta ${chartData.lapNumber} – ${getChartLabel(variableKey)}`;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#FFFFFF' }
        },
        title: {
          display: true,
          text: voltaLabel,
          color: '#FFFFFF',
          font: { size: 16 }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Hora', color: '#FFFFFF' },
          ticks: { color: '#FFFFFF' },
          grid: { color: '#FFFFFF' }
        },
        y: {
          title: { display: true, text: getChartLabel(variableKey), color: '#FFFFFF' },
          ticks: { color: '#FFFFFF' },
          grid: { color: '#FFFFFF' },
          beginAtZero: true
        }
      }
    }
  });
}

// ===== Objetos para armazenar gráficos ativos =====
let activeCharts = {};     // index.html
let comparisonCharts = {}; // page2.html

/**
 * Destroi gráficos antigos da Página Principal.
 */
function destroyCharts(charts) {
  for (const key in charts) {
    if (charts[key]) {
      charts[key].destroy();
    }
  }
}

/**
 * Destroi gráficos antigos da Página de Comparação.
 */
function destroyComparisonCharts(charts) {
  for (const key in charts) {
    if (charts[key]) {
      charts[key].destroy();
    }
  }
}

/**
 * Identifica se estamos em index.html (page1) ou page2.html (page2).
 */
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.endsWith('page2.html')) {
    return 'page2';
  }
  return 'page1';
}

/**
 * Retorna as variáveis selecionadas (checkboxes) de um formulário.
 */
function getSelectedVariables(formId) {
  const form = document.getElementById(formId);
  const checkboxes = form.querySelectorAll('input[name="variables"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// ============ Página Principal =============
function initPage1Charts(transmitterData, selectedVariables) {
  destroyCharts(activeCharts);
  activeCharts = {};

  const chartsContainer = document.getElementById('chartsContainer');
  chartsContainer.innerHTML = '';

  if (selectedVariables.length === 0) {
    chartsContainer.innerHTML = '<p>Nenhuma variável selecionada para exibir.</p>';
    return;
  }

  // Para cada variável, filtra somente a volta atual e cria o gráfico
  selectedVariables.forEach(variable => {
    const chartData = prepareChartData(transmitterData, variable);
    if (!chartData) return;

    const chartDiv = document.createElement('div');
    chartDiv.classList.add('chart-container');
    const canvas = document.createElement('canvas');
    canvas.id = `${variable}Chart`;
    chartDiv.appendChild(canvas);
    chartsContainer.appendChild(chartDiv);

    const ctx = canvas.getContext('2d');
    const chart = createChart(ctx, chartData, variable);
    activeCharts[variable] = chart;
  });
}

/**
 * Atualiza os gráficos da Página Principal chamando novamente /api/transmitter-data
 * e exibindo **somente a volta atual**.
 */
async function updatePage1Charts(selectedVariables) {
  const updatedData = await fetchData('/api/transmitter-data');

  selectedVariables.forEach(variable => {
    const chart = activeCharts[variable];
    if (!chart) return;

    const newChartData = prepareChartData(updatedData, variable);
    if (!newChartData) return;

    chart.data.labels = newChartData.labels;
    chart.data.datasets[0].data = newChartData.datasets[0].data;

    // Atualiza também o título para "Volta X - Variável"
    chart.options.plugins.title.text = `Volta ${newChartData.lapNumber} – ${getChartLabel(variable)}`;

    chart.update();
  });
}

// ============ Página de Comparação =============
function initPage2Charts(comparisonData, selectedVariables) {
  destroyComparisonCharts(comparisonCharts);
  comparisonCharts = {};

  const comparisonChartsContainer = document.querySelector('.comparison-charts');
  comparisonChartsContainer.innerHTML = '';

  if (selectedVariables.length === 0) {
    comparisonChartsContainer.innerHTML = '<p>Nenhuma variável selecionada para comparação.</p>';
    return;
  }

  // Aqui, dependendo do que você quer para a comparação,
  // pode filtrar a volta mais recente OU exibir duas voltas específicas.
  // Exemplo: mantemos a lógica normal das duas voltas (lap1 / lap2).
  // Se quiser exibir somente a volta atual, precisa filtrar as arrays lap1/ lap2 do server.
  
  selectedVariables.forEach(variable => {
    const arrLap1 = comparisonData.lap1[variable];
    const arrLap2 = comparisonData.lap2[variable];
    if (!arrLap1 || !arrLap2 || arrLap1.length === 0 || arrLap2.length === 0) {
      return;
    }

    const chartDiv = document.createElement('div');
    chartDiv.classList.add('chart-container');
    const canvas = document.createElement('canvas');
    canvas.id = `compare_${variable}Chart`;
    chartDiv.appendChild(canvas);
    comparisonChartsContainer.appendChild(chartDiv);

    // Se quiser filtrar somente a volta atual, teria que achar maxLap em arrLap1 e arrLap2...
    // Mas, como é comparação de duas voltas específicas, assumimos que lap1 e lap2 já são “voltas definidas”.

    const limitedLap1 = arrLap1.slice(-50);
    const limitedLap2 = arrLap2.slice(-50);

    // Rótulos assumindo data local
    const labels = limitedLap1.map(e => new Date(e.timestamp).toLocaleTimeString());

    const datasetLap1 = {
      label: `Volta ${limitedLap1[0].lap_number}`,
      data: limitedLap1.map(e => e[variable] || 0),
      fill: false,
      borderColor: '#FF6384',
      tension: 0.1
    };
    const datasetLap2 = {
      label: `Volta ${limitedLap2[0].lap_number}`,
      data: limitedLap2.map(e => e[variable] || 0),
      fill: false,
      borderColor: '#36A2EB',
      tension: 0.1
    };

    const combinedData = {
      labels,
      datasets: [datasetLap1, datasetLap2]
    };

    const ctx = canvas.getContext('2d');
    const chartLabel = `${getChartLabel(variable)} - Comparação Voltas`;

    const chart = new Chart(ctx, {
      type: 'line',
      data: combinedData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#FFFFFF' }
          },
          title: {
            display: true,
            text: chartLabel,
            color: '#FFFFFF',
            font: { size: 16 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Hora', color: '#FFFFFF' },
            ticks: { color: '#FFFFFF' },
            grid: { color: '#FFFFFF' }
          },
          y: {
            title: { display: true, text: getChartLabel(variable), color: '#FFFFFF' },
            ticks: { color: '#FFFFFF' },
            grid: { color: '#FFFFFF' },
            beginAtZero: true
          }
        }
      }
    });

    comparisonCharts[variable] = chart;
  });
}

// Se quiser atualizar a comparação periodicamente, crie algo como updatePage2Charts() ...

/**
 * Identifica se estamos em index.html ou page2.html e inicializa os gráficos de acordo.
 */
async function initCharts() {
  const currentPage = getCurrentPage();

  if (currentPage === 'page1') {
    // Página Principal
    const selectedVariables = getSelectedVariables('variableForm');
    const transmitterData = await fetchData('/api/transmitter-data');
    initPage1Charts(transmitterData, selectedVariables);

    // Botão "Atualizar Gráficos"
    const updateBtn = document.getElementById('updateButton');
    if (updateBtn) {
      updateBtn.addEventListener('click', async () => {
        const varsNow = getSelectedVariables('variableForm');
        const newData = await fetchData('/api/transmitter-data');
        initPage1Charts(newData, varsNow);
      });
    }
    
    // Atualiza a cada xs
    setInterval(async () => {
      const selectedVars = getSelectedVariables('variableForm');
      await updatePage1Charts(selectedVars);
    }, 1000);

  } else if (currentPage === 'page2') {
    // Página de Comparação
    const compareBtn = document.getElementById('compareVariablesButton');
    if (compareBtn) {
      compareBtn.addEventListener('click', async () => {
        const lap1 = parseInt(document.getElementById('lap1').value, 10);
        const lap2 = parseInt(document.getElementById('lap2').value, 10);
        const selectedVars = getSelectedVariables('comparisonVariableForm');
        
        if (!lap1 || !lap2) {
          alert('Por favor, selecione ambas as voltas para comparação.');
          return;
        }
        if (lap1 === lap2) {
          alert('Por favor, selecione voltas diferentes para comparação.');
          return;
        }

        const comparisonData = await fetchData(`/api/compare/${lap1}/${lap2}`);
        initPage2Charts(comparisonData, selectedVars);
      });
    }

    // Se quiser atualização da comparação no page2, implemente algo como setInterval...
  }
}

// Chama initCharts quando a janela carrega
window.onload = initCharts;
