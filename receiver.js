// receiver.js

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ==============================
// 1) Caminhos dos Arquivos
// ==============================
const receiverLogPath = path.join(__dirname, 'receiver.log');
const jsonFilePath = path.join(__dirname, 'receiverTelemetryData.json');
const dbFilePath = path.join(__dirname, 'receiverTelemetryData.db');
const transmitterLogPath = path.join(__dirname, 'transmitter.log'); // Arquivo que o Receiver lê

// ==============================
// 2) Limpeza Automática de Arquivos
// ==============================

try {
  // Limpa o arquivo de log do Receptor
  fs.writeFileSync(receiverLogPath, '', 'utf8');
  console.log(`Arquivo de log ${receiverLogPath} foi limpado antes de iniciar o Receptor.`);
} catch (err) {
  console.error('Erro ao limpar receiver.log:', err.message);
}

try {
  // Limpa o arquivo JSON (reinicia com um array vazio [])
  fs.writeFileSync(jsonFilePath, '[]', 'utf8');
  console.log(`Arquivo JSON ${jsonFilePath} foi reiniciado (array vazio).`);
} catch (err) {
  console.error('Erro ao limpar receiverTelemetryData.json:', err.message);
}

// ==============================
// 3) Inicialização do Banco de Dados SQLite
// ==============================
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error(`Erro ao conectar ao banco de dados: ${err.message}`);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Limpa a tabela 'telemetry' para remover dados antigos
db.run('DELETE FROM telemetry', (err) => {
  if (err) {
    console.error('Erro ao limpar tabela telemetry:', err.message);
  } else {
    console.log('Tabela telemetry foi limpada antes de iniciar o Receptor.');
  }
});

// ==============================
// 4) Funções de Inserção no Banco e JSON
// ==============================

/**
 * Insere dados no banco de dados (tabela 'telemetry').
 * Ajuste conforme a estrutura da sua tabela.
 */
function insertTelemetryData(data) {
  const stmt = db.prepare(`
    INSERT INTO telemetry (
      timestamp,
      alarme_status,
      avg_lap_speed,
      beacon_code,
      box_voltage,
      correct_stance,
      correct_speed,
      cpu_usage,
      cumulative_diff,
      cumulative_time,
      stance,
      ecu_air_box_temp,
      ecu_cooler_temp,
      ecu_engine_safe_hard,
      ecu_engine_safe_soft,
      ecu_fan,
      ecu_fuel_pressure,
      ecu_fuel_pump,
      ecu_fuel_temp,
      ecu_fuel_total,
      ecu_gear,
      ecu_gear_voltage,
      ecu_kl15,
      ecu_lambida_1,
      ecu_lambida_2,
      ecu_oil_lamp,
      ecu_oil_pressure,
      ecu_oil_temp,
      ecu_push_to_pass_block,
      ecu_push_to_pass_button,
      ecu_push_to_pass_delay,
      ecu_push_to_pass_lamp,
      ecu_push_to_pass_on,
      ecu_push_to_pass_remain,
      ecu_push_to_pass_timer,
      ecu_pit_limit_button,
      ecu_pit_limit_on,
      ecu_powershift_on,
      ecu_powershift_sensor,
      ecu_rpm_limit,
      ecu_prm,
      ecu_syncro,
      eco_throttle,
      ecy_throttle_peddal,
      ecu_voltage,
      elipse_laptime,
      elipse_time,
      front_left_wheel_speed,
      front_right_wheel_speed,
      front_brake,
      fuel_economy,
      lap_number,
      lap_fuel_left,
      lateral_g,
      logging,
      longitudinal_g,
      map_position_d,
      map_position_x,
      map_position_y,
      map_position_z,
      max_straight_speed,
      minimal_corner_speed,
      network_time,
      oil_temp,
      rear_brake,
      running_lap_time,
      section_diff,
      section_time,
      speed,
      steering,
      tank_fuel
    ) VALUES (
      @timestamp,
      @alarme_status,
      @avg_lap_speed,
      @beacon_code,
      @box_voltage,
      @correct_stance,
      @correct_speed,
      @cpu_usage,
      @cumulative_diff,
      @cumulative_time,
      @stance,
      @ecu_air_box_temp,
      @ecu_cooler_temp,
      @ecu_engine_safe_hard,
      @ecu_engine_safe_soft,
      @ecu_fan,
      @ecu_fuel_pressure,
      @ecu_fuel_pump,
      @ecu_fuel_temp,
      @ecu_fuel_total,
      @ecu_gear,
      @ecu_gear_voltage,
      @ecu_kl15,
      @ecu_lambida_1,
      @ecu_lambida_2,
      @ecu_oil_lamp,
      @ecu_oil_pressure,
      @ecu_oil_temp,
      @ecu_push_to_pass_block,
      @ecu_push_to_pass_button,
      @ecu_push_to_pass_delay,
      @ecu_push_to_pass_lamp,
      @ecu_push_to_pass_on,
      @ecu_push_to_pass_remain,
      @ecu_push_to_pass_timer,
      @ecu_pit_limit_button,
      @ecu_pit_limit_on,
      @ecu_powershift_on,
      @ecu_powershift_sensor,
      @ecu_rpm_limit,
      @ecu_prm,
      @ecu_syncro,
      @eco_throttle,
      @ecy_throttle_peddal,
      @ecu_voltage,
      @elipse_laptime,
      @elipse_time,
      @front_left_wheel_speed,
      @front_right_wheel_speed,
      @front_brake,
      @fuel_economy,
      @lap_number,
      @lap_fuel_left,
      @lateral_g,
      @logging,
      @longitudinal_g,
      @map_position_d,
      @map_position_x,
      @map_position_y,
      @map_position_z,
      @max_straight_speed,
      @minimal_corner_speed,
      @network_time,
      @oil_temp,
      @rear_brake,
      @running_lap_time,
      @section_diff,
      @section_time,
      @speed,
      @steering,
      @tank_fuel
    )
  `);

  stmt.run({
    '@timestamp': data.timestamp || null,
    '@alarme_status': data.alarme_status || null,
    '@avg_lap_speed': data.avg_lap_speed || null,
    '@beacon_code': data.beacon_code || null,
    '@box_voltage': data.box_voltage || null,
    '@correct_stance': data.correct_stance ? 1 : 0,
    '@correct_speed': data.correct_speed || null,
    '@cpu_usage': data.cpu_usage || null,
    '@cumulative_diff': data.cumulative_diff || null,
    '@cumulative_time': data.cumulative_time || null,
    '@stance': data.stance || null,
    '@ecu_air_box_temp': data.ecu_air_box_temp || null,
    '@ecu_cooler_temp': data.ecu_cooler_temp || null,
    '@ecu_engine_safe_hard': data.ecu_engine_safe_hard ? 1 : 0,
    '@ecu_engine_safe_soft': data.ecu_engine_safe_soft ? 1 : 0,
    '@ecu_fan': data.ecu_fan ? 1 : 0,
    '@ecu_fuel_pressure': data.ecu_fuel_pressure || null,
    '@ecu_fuel_pump': data.ecu_fuel_pump ? 1 : 0,
    '@ecu_fuel_temp': data.ecu_fuel_temp || null,
    '@ecu_fuel_total': data.ecu_fuel_total || null,
    '@ecu_gear': data.ecu_gear || null,
    '@ecu_gear_voltage': data.ecu_gear_voltage || null,
    '@ecu_kl15': data.ecu_kl15 ? 1 : 0,
    '@ecu_lambida_1': data.ecu_lambida_1 ? 1 : 0,
    '@ecu_lambida_2': data.ecu_lambida_2 ? 1 : 0,
    '@ecu_oil_lamp': data.ecu_oil_lamp ? 1 : 0,
    '@ecu_oil_pressure': data.ecu_oil_pressure || null,
    '@ecu_oil_temp': data.ecu_oil_temp || null,
    '@ecu_push_to_pass_block': data.ecu_push_to_pass_block ? 1 : 0,
    '@ecu_push_to_pass_button': data.ecu_push_to_pass_button ? 1 : 0,
    '@ecu_push_to_pass_delay': data.ecu_push_to_pass_delay || null,
    '@ecu_push_to_pass_lamp': data.ecu_push_to_pass_lamp ? 1 : 0,
    '@ecu_push_to_pass_on': data.ecu_push_to_pass_on ? 1 : 0,
    '@ecu_push_to_pass_remain': data.ecu_push_to_pass_remain || null,
    '@ecu_push_to_pass_timer': data.ecu_push_to_pass_timer || null,
    '@ecu_pit_limit_button': data.ecu_pit_limit_button ? 1 : 0,
    '@ecu_pit_limit_on': data.ecu_pit_limit_on ? 1 : 0,
    '@ecu_powershift_on': data.ecu_powershift_on ? 1 : 0,
    '@ecu_powershift_sensor': data.ecu_powershift_sensor ? 1 : 0,
    '@ecu_rpm_limit': data.ecu_rpm_limit || null,
    '@ecu_prm': data.ecu_prm ? 1 : 0,
    '@ecu_syncro': data.ecu_syncro ? 1 : 0,
    '@eco_throttle': data.eco_throttle || null,
    '@ecy_throttle_peddal': data.ecy_throttle_peddal || null,
    '@ecu_voltage': data.ecu_voltage || null,
    '@elipse_laptime': data.elipse_laptime || null,
    '@elipse_time': data.elipse_time || null,
    '@front_left_wheel_speed': data.front_left_wheel_speed || null,
    '@front_right_wheel_speed': data.front_right_wheel_speed || null,
    '@front_brake': data.front_brake ? 1 : 0,
    '@fuel_economy': data.fuel_economy || null,
    '@lap_number': data.lap_number || null,
    '@lap_fuel_left': data.lap_fuel_left || null,
    '@lateral_g': data.lateral_g || null,
    '@logging': data.logging ? 1 : 0,
    '@longitudinal_g': data.longitudinal_g || null,
    '@map_position_d': data.map_position_d || null,
    '@map_position_x': data.map_position_x || null,
    '@map_position_y': data.map_position_y || null,
    '@map_position_z': data.map_position_z || null,
    '@max_straight_speed': data.max_straight_speed || null,
    '@minimal_corner_speed': data.minimal_corner_speed || null,
    '@network_time': data.network_time || null,
    '@oil_temp': data.oil_temp || null,
    '@rear_brake': data.rear_brake ? 1 : 0,
    '@running_lap_time': data.running_lap_time || null,
    '@section_diff': data.section_diff || null,
    '@section_time': data.section_time || null,
    '@speed': data.speed || null,
    '@steering': data.steering || null,
    '@tank_fuel': data.tank_fuel || null
  }, (err) => {
    if (err) {
      console.error(`Erro ao inserir dados no banco de dados: ${err.message}`);
    }
  });
  stmt.finalize();
}

/**
 * Salva dados no arquivo JSON (adiciona ao final do array).
 */
function saveTelemetryToJSON(data) {
  let existingData = [];
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf8');
    existingData = JSON.parse(content);
    if (!Array.isArray(existingData)) {
      existingData = [];
    }
  } catch (err) {
    existingData = [];
  }
  existingData.push(data);
  fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2), 'utf8');
}

/**
 * Monitorar o arquivo transmitter.log e inserir no banco/JSON a cada modificação.
 */
function monitorLogFile() {
  fs.watchFile(transmitterLogPath, (curr, prev) => {
    fs.readFile(transmitterLogPath, 'utf8', (err, fileData) => {
      if (err) {
        console.error('Erro ao ler transmitter.log:', err.message);
        return;
      }

      const lines = fileData.trim().split('\n');
      // Pega a última linha
      const lastLine = lines[lines.length - 1];

      try {
        // Faz parse do JSON
        const telemetryData = JSON.parse(lastLine);

        // 1) Insere no banco
        insertTelemetryData(telemetryData);

        // 2) Salva no arquivo JSON
        saveTelemetryToJSON(telemetryData);

        // 3) Log no console
        console.log('Dados armazenados:', telemetryData);

      } catch (parseErr) {
        console.error('Erro ao parsear dados de telemetria:', parseErr.message);
      }
    });
  });
}

// Inicia a monitoração
monitorLogFile();

console.log('Receptor iniciado. Aguardando dados no transmitter.log...');
