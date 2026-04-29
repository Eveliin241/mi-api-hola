const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path'); // Importante para manejar rutas de archivos

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- RUTA PRINCIPAL PROFESIONAL ---
// En lugar de enviar texto, enviamos el archivo HTML real
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

// OBTENER ÚLTIMO DATO (Para el mensaje principal)
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT observaciones FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        res.json({ data: query.rows[0] || { observaciones: "Sin registros hoy." } });
    } catch (err) { res.status(500).json({ data: { observaciones: "Error de conexión" } }); }
});

// HISTORIAL EN JSON PARA QUE EL HTML HAGA LA LISTA BONITA
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

// REGISTRO DE USUARIOS (Perfil de salud)
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
app.listen(PORT, () => console.log('🚀 Sistema Profesional Online'));