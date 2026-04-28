const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ESTILO CSS COMPARTIDO PARA TODO EL BACKEND
const sharedStyle = `
    <style>
        body { 
            margin: 0; font-family: 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #1d976c 0%, #93f9b9 100%); 
            min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px; color: white;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(15px);
            border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 30px; width: 90%; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 20px;
        }
        h1 { margin-top: 0; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .data-item { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #fff; }
        .label { font-weight: bold; color: #93f9b9; font-size: 0.8em; text-transform: uppercase; }
        .value { font-size: 1.1em; display: block; margin-top: 5px; }
        .btn-back { 
            text-decoration: none; color: white; font-weight: bold; border: 1px solid white; 
            padding: 10px 20px; border-radius: 10px; transition: 0.3s; margin-bottom: 30px;
        }
        .btn-back:hover { background: white; color: #1d976c; }
    </style>
`;

// 1. RUTA DE BIENVENIDA (Tu portada actual que ya te gustó)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>API Salud & Lavanda</title>
            <style>
                @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0); } }
                body { margin: 0; font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1d976c 0%, #93f9b9 100%); height: 100vh; display: flex; justify-content: center; align-items: center; color: white; text-align: center; }
                .glass-card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(15px); border-radius: 25px; padding: 50px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
                .icon { font-size: 70px; animation: float 3s ease-in-out infinite; margin-bottom: 10px; display: inline-block; }
                .btn { text-decoration: none; color: white; border: 2px solid white; padding: 12px 25px; border-radius: 10px; font-weight: bold; margin: 10px; display: inline-block; transition: 0.3s; }
                .btn:hover { background: white; color: #1d976c; }
            </style>
        </head>
        <body>
            <div class="glass-card">
                <div class="icon">🌿</div>
                <h1>Salud & Lavanda</h1>
                <p>Plataforma de monitoreo y nutrición</p>
                <a href="/datos" class="btn">📊 Ver Estado</a>
                <a href="/lavandas" class="btn">📅 Historial</a>
            </div>
        </body>
        </html>
    `);
});

// 2. ENDPOINT DE DATOS (ESTADO ACTUAL) - ¡AHORA CON DISEÑO!
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        const data = query.rows[0] || { observaciones: "Sin registros aún" };
        
        res.send(`
            ${sharedStyle}
            <a href="/" class="btn-back">← Volver al Inicio</a>
            <div class="glass-card">
                <h1>📍 Estado del Huerto</h1>
                <div class="data-item">
                    <span class="label">Última Observación</span>
                    <span class="value">${data.observaciones}</span>
                </div>
                <div class="data-item">
                    <span class="label">Fecha de Registro</span>
                    <span class="value">${data.fecha ? new Date(data.fecha).toLocaleString() : 'N/A'}</span>
                </div>
            </div>
        `);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// 3. ENDPOINT DE HISTORIAL - ¡AHORA CON TARJETAS!
app.get('/lavandas', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC');
        const rows = query.rows.map(l => `
            <div class="glass-card">
                <div class="data-item">
                    <span class="label">Fecha: ${new Date(l.fecha).toLocaleDateString()}</span>
                    <span class="value">🌿 ${l.estado_salud} | 📏 ${l.altura_cm} cm</span>
                    <p style="margin-top:10px; font-size: 0.9em;">${l.observaciones}</p>
                </div>
            </div>
        `).join('');

        res.send(`
            ${sharedStyle}
            <a href="/" class="btn-back">← Volver al Inicio</a>
            <h1>📅 Historial de Crecimiento</h1>
            ${rows || '<p>No hay registros guardados.</p>'}
        `);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// 4. REGISTRO (Este se queda igual porque no es para humanos, es para el código)
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura, edad, actividad_fisica, objetivo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre',
            [nombre, email, password, peso, altura, edad, actividad_fisica, objetivo]
        );
        res.status(201).json({ status: "success", usuario: result.rows[0] });
    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Visual Backend Ready!'));