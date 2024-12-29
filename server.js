// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

// Serve arquivos estáticos da pasta 'dashboard'
app.use(express.static(path.join(__dirname, 'dashboard')));

// Inicializa o banco de dados
const db = new sqlite3.Database('receiverTelemetryData.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Servidor: Conectado ao banco de dados SQLite.');
  }
});

// Endpoint de dados para a Página Principal
app.get('/api/transmitter-data', (req, res) => {
  // Busca as últimas 50 entradas para cada variável, ou outro critério
  // Exemplo: Seleciona tudo e agrupa no formato { speed: [...], brakePedal: [...], ... }
  const query = `SELECT * FROM telemetry ORDER BY id DESC LIMIT 500`; // Ajuste conforme necessidade
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados de telemetria:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }

    // Converte o array de rows em um objeto agrupado por variável
    const dataByVariable = {};
    rows.forEach((row) => {
      // Para cada coluna da tabela, adiciona no dataByVariable
      Object.keys(row).forEach((col) => {
        if (col !== 'id') {
          if (!dataByVariable[col]) {
            dataByVariable[col] = [];
          }
          dataByVariable[col].push({ [col]: row[col], timestamp: row.timestamp, lap_number: row.lap_number });
        }
      });
    });

    res.json(dataByVariable);
  });
});

// Endpoint para comparação de voltas
app.get('/api/compare/:lap1/:lap2', (req, res) => {
  const lap1 = parseInt(req.params.lap1, 10);
  const lap2 = parseInt(req.params.lap2, 10);

  if (isNaN(lap1) || isNaN(lap2)) {
    return res.status(400).json({ error: 'Parâmetros de volta inválidos.' });
  }

  // Busca os dados de cada volta separadamente
  const queryLap1 = `SELECT * FROM telemetry WHERE lap_number = ? ORDER BY id ASC`;
  const queryLap2 = `SELECT * FROM telemetry WHERE lap_number = ? ORDER BY id ASC`;

  const lap1Data = {};
  const lap2Data = {};

  db.all(queryLap1, [lap1], (err1, rowsLap1) => {
    if (err1) {
      console.error('Erro ao buscar dados da volta 1:', err1.message);
      return res.status(500).json({ error: 'Erro ao buscar volta 1.' });
    }

    // Agrupa por variável
    rowsLap1.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (col !== 'id') {
          if (!lap1Data[col]) {
            lap1Data[col] = [];
          }
          lap1Data[col].push({ [col]: row[col], timestamp: row.timestamp, lap_number: row.lap_number });
        }
      });
    });

    db.all(queryLap2, [lap2], (err2, rowsLap2) => {
      if (err2) {
        console.error('Erro ao buscar dados da volta 2:', err2.message);
        return res.status(500).json({ error: 'Erro ao buscar volta 2.' });
      }

      // Agrupa por variável
      rowsLap2.forEach((row) => {
        Object.keys(row).forEach((col) => {
          if (col !== 'id') {
            if (!lap2Data[col]) {
              lap2Data[col] = [];
            }
            lap2Data[col].push({ [col]: row[col], timestamp: row.timestamp, lap_number: row.lap_number });
          }
        });
      });

      // Retorna no formato { lap1: { ... }, lap2: { ... } }
      res.json({ lap1: lap1Data, lap2: lap2Data });
    });
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor hospedado em http://localhost:${PORT}`);
});

// Encerra o banco de dados corretamente ao finalizar o processo
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar o banco de dados SQLite:', err.message);
    }
    process.exit(0);
  });
});
