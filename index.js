const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/lista-usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM usuarios ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json([]); }
});

app.post('/registrar', async (req, res) => {
    try {
        const { nombre } = req.body;
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, 0, 0, 0, "baja", "mantener") RETURNING id, nombre',
            [nombre, `${Date.now()}@huerto.com`, '123']
        );
        res.json({ status: "success", usuario: result.rows[0] });
    } catch (err) { res.status(500).json({ status: "error" }); }
});

app.post('/nueva-observacion', async (req, res) => {
    try {
        const { usuario_id, altura, estado, notas } = req.body;
        await pool.query(
            'INSERT INTO seguimiento_lavanda (usuario_id, altura_cm, estado_salud, observaciones) VALUES ($1, $2, $3, $4)',
            [usuario_id, altura, estado, notas]
        );
        res.json({ status: "success" });
    } catch (err) { res.status(500).json({ status: "error" }); }
});

app.get('/lavandas_json', async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT s.id, s.fecha, s.altura_cm, s.estado_salud, s.observaciones, u.nombre 
            FROM seguimiento_lavanda s 
            JOIN usuarios u ON s.usuario_id = u.id 
            ORDER BY s.fecha DESC
        `);
        res.json(query.rows);
    } catch (err) { res.status(500).json([]); }
});

app.delete('/admin/borrar-usuario/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM seguimiento_lavanda WHERE usuario_id = $1', [req.params.id]);
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.json({ status: "success" });
    } catch (err) { res.status(500).json({ status: "error" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Sistema Online'));