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

// Diseño de la Landing Page de la API
const headHTML = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="https://fonts.gstatic.com/s/i/short-term/release/googlestylesheet/leaf/default/24px.svg">
    <style>
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1d976c 0%, #93f9b9 100%); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; }
        .card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(15px); padding: 40px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 15px 35px rgba(0,0,0,0.2); max-width: 500px; }
        .btn { text-decoration: none; color: white; border: 2px solid white; padding: 12px 25px; border-radius: 10px; font-weight: bold; display: inline-block; margin: 10px; transition: 0.3s; }
        .btn:hover { background: white; color: #1d976c; }
    </style>
`;

// RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.send(`<html><head>${headHTML}</head><body>
        <div class="card">
            <h1 style="font-size: 60px; margin: 0;">🌿</h1>
            <h1>Salud & Lavanda API</h1>
            <p>Servidor de Datos Activo</p>
            <a href="/lavandas" class="btn">📅 Ver Historial</a>
        </div>
    </body></html>`);
});

// LISTA DE USUARIOS PARA EL SELECTOR
app.get('/lista-usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM usuarios ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json([]); }
});

// GUARDAR NUEVA OBSERVACIÓN
app.post('/nueva-observacion', async (req, res) => {
    const { usuario_id, altura, estado, notas } = req.body;
    try {
        await pool.query(
            'INSERT INTO seguimiento_lavanda (usuario_id, altura_cm, estado_salud, observaciones) VALUES ($1, $2, $3, $4)',
            [usuario_id, altura, estado, notas]
        );
        res.json({ status: "success" });
    } catch (err) { res.status(500).json({ status: "error", message: err.message }); }
});

// OBTENER ÚLTIMO DATO
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT observaciones FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        res.json({ data: query.rows[0] || { observaciones: "Sin registros hoy." } });
    } catch (err) { res.status(500).json({ data: { observaciones: "Error de conexión" } }); }
});

// HISTORIAL EN JSON PARA EL HTML
app.get('/lavandas_json', async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT s.*, u.nombre 
            FROM seguimiento_lavanda s 
            JOIN usuarios u ON s.usuario_id = u.id 
            ORDER BY s.fecha DESC
        `);
        res.json(query.rows);
    } catch (err) { res.status(500).json([]); }
});

// HISTORIAL VISUAL (Para el botón de la API)
app.get('/lavandas', async (req, res) => {
    const query = await pool.query('SELECT s.*, u.nombre FROM seguimiento_lavanda s JOIN usuarios u ON s.usuario_id = u.id ORDER BY s.fecha DESC');
    const list = query.rows.map(l => `<div style="background:rgba(255,255,255,0.1); padding:15px; margin:10px; border-radius:10px; text-align:left;">
        <b>${l.nombre}</b> - ${new Date(l.fecha).toLocaleDateString()}<br>
        <i>"${l.observaciones}"</i></div>`).join('');
    res.send(`<html><head>${headHTML}</head><body><a href="/" class="btn">Volver</a>${list}</body></html>`);
});

// REGISTRO DE USUARIOS
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura, edad, actividad_fisica, objetivo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre',
            [nombre, email, password, peso, altura, edad, actividad_fisica, objetivo]
        );
        res.status(201).json({ status: "success", usuario: result.rows[0] });
    } catch (err) { res.status(400).json({ status: "error", message: "Error al registrar" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 API Lista'));

// Actualización forzada.