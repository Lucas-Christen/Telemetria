// transmitter.js

const fs = require('fs');
const path = require('path');

// ==== Parâmetros de Volta e Duração ====
const TOTAL_LAPS = 10;       // Quantidade total de voltas (1 a 10)
const LAP_DURATION = 60000;  // 60.000 milissegundos = 60 segundos

// Caminho do arquivo de log do transmissor
const logPath = path.join(__dirname, 'transmitter.log');

// 1) Limpa o transmitter.log antes de iniciar
try {
  fs.writeFileSync(logPath, '', 'utf8'); // Substitui o conteúdo por vazio
  console.log(`Arquivo de log ${logPath} foi limpo antes de iniciar o Transmissor.`);
} catch (err) {
  console.error('Erro ao limpar transmitter.log:', err.message);
}

// ====== Lógica normal do Transmissor ======
let currentLap = 1;         // Inicia na volta 1
let simulationRunning = true;
let simulationCompleted = false;
let currentLapStartTime = Date.now(); // Marca de tempo do início da volta atual

/**
 * Função para gerar valores aleatórios dentro de um intervalo
 */
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Função para gerar dados dos sensores (todas as variáveis da Stock Car).
 * Adicione ou remova conforme sua necessidade.
 */
function generateSensorData() {
  const data = {
    timestamp: new Date().toISOString(),
    lap_number: currentLap,

    // Exemplos de variáveis (inclua todas as que desejar):
    alarme_status: Math.random() < 0.5 ? 'Ativo' : 'Inativo',
    avg_lap_speed: getRandom(100, 300),
    beacon_code: `BC-${Math.floor(getRandom(1000, 9999))}`,
    box_voltage: getRandom(12, 14),
    correct_stance: Math.random() < 0.5,
    correct_speed: getRandom(100, 300),
    cpu_usage: getRandom(0, 100),
    cumulative_diff: getRandom(-5, 5),
    cumulative_time: new Date().toISOString(),
    stance: Math.random() < 0.5 ? 'Correto' : 'Incorreto',
    ecu_air_box_temp: getRandom(20, 100),
    ecu_cooler_temp: getRandom(20, 100),
    ecu_engine_safe_hard: Math.random() < 0.5,
    ecu_engine_safe_soft: Math.random() < 0.5,
    ecu_fan: Math.random() < 0.5,
    ecu_fuel_pressure: getRandom(30, 80),
    ecu_fuel_pump: Math.random() < 0.5,
    ecu_fuel_temp: getRandom(20, 100),
    ecu_fuel_total: getRandom(0, 100),
    ecu_gear: Math.floor(getRandom(1, 6)),
    ecu_gear_voltage: getRandom(0, 12),
    ecu_kl15: Math.random() < 0.5,
    ecu_lambida_1: Math.random() < 0.5,
    ecu_lambida_2: Math.random() < 0.5,
    ecu_oil_lamp: Math.random() < 0.5,
    ecu_oil_pressure: getRandom(20, 80),
    ecu_oil_temp: getRandom(20, 100),
    ecu_push_to_pass_block: Math.random() < 0.5,
    ecu_push_to_pass_button: Math.random() < 0.5,
    ecu_push_to_pass_delay: Math.floor(getRandom(0, 10)),
    ecu_push_to_pass_lamp: Math.random() < 0.5,
    ecu_push_to_pass_on: Math.random() < 0.5,
    ecu_push_to_pass_remain: Math.floor(getRandom(0, 5)),
    ecu_push_to_pass_timer: Math.floor(getRandom(0, 300)),
    ecu_pit_limit_button: Math.random() < 0.5,
    ecu_pit_limit_on: Math.random() < 0.5,
    ecu_powershift_on: Math.random() < 0.5,
    ecu_powershift_sensor: Math.random() < 0.5,
    ecu_rpm_limit: getRandom(5000, 12000),
    ecu_prm: Math.random() < 0.5,
    ecu_syncro: Math.random() < 0.5,
    eco_throttle: getRandom(0, 100),
    ecy_throttle_peddal: getRandom(0, 100),
    ecu_voltage: getRandom(0, 14),
    elipse_laptime: '00:01:30', // Exemplo fixo
    elipse_time: new Date().toISOString(),
    front_left_wheel_speed: getRandom(0, 300),
    front_right_wheel_speed: getRandom(0, 300),
    front_brake: Math.random() < 0.5,
    fuel_economy: getRandom(5, 20),
    lap_fuel_left: getRandom(0, 100),
    lateral_g: getRandom(-3, 3),
    logging: Math.random() < 0.5,
    longitudinal_g: getRandom(-3, 3),
    map_position_d: getRandom(0, 1000),
    map_position_x: getRandom(-100, 100),
    map_position_y: getRandom(-100, 100),
    map_position_z: getRandom(-100, 100),
    max_straight_speed: getRandom(200, 400),
    minimal_corner_speed: getRandom(50, 150),
    network_time: new Date().toISOString(),
    oil_temp: getRandom(50, 120),
    rear_brake: Math.random() < 0.5,
    running_lap_time: '00:02:00',
    section_diff: getRandom(-10, 10),
    section_time: '00:30:00',
    speed: getRandom(0, 400),
    steering: getRandom(-500, 500),
    tank_fuel: getRandom(0, 100)
  };

  return data;
}

/**
 * Escreve os dados no arquivo de log
 */
function sendData(data) {
  const logLine = JSON.stringify(data) + '\n';
  fs.appendFileSync(logPath, logLine, 'utf8');
}

/**
 * Função principal de geração/controle de dados a cada segundo
 */
function mainLoop() {
  // Se a simulação já foi parada, não gera mais dados
  if (!simulationRunning) return;

  // Enquanto não concluído, geramos dados
  if (!simulationCompleted) {
    const data = generateSensorData();
    sendData(data);
    console.log('Dados enviados:', data);
  }

  // Verifica se 60s se passaram nesta volta
  const now = Date.now();
  const elapsed = now - currentLapStartTime;

  if (elapsed >= LAP_DURATION) {
    currentLap++;
    currentLapStartTime = now; // Reinicia o tempo para a próxima volta

    if (currentLap > TOTAL_LAPS) {
      console.log(`Volta 10 concluída. Aguardando 60s finais para encerrar...`);
      simulationCompleted = true;

      // Agenda o encerramento total após mais 60 segundos
      setTimeout(() => {
        console.log('Simulação finalizada após a volta 10.');
        simulationRunning = false;
        clearInterval(mainInterval); // Para este setInterval principal
      }, LAP_DURATION);
    }
  }
}

// Gera e envia dados a cada 1 segundo
const mainInterval = setInterval(mainLoop, 1000);

console.log('Transmissor iniciado. Geração de dados a cada 1 segundo...');
