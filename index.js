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

// Forzar que siempre se vea el index elegante
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/lavandas', (req, res) => res.redirect('/'));

app.get('/lista-usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM usuarios ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send([]); }
});

app.post('/registrar', async (req, res) => {
    const { nombre } = req.body;
    await pool.query('INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, 0,0,0, $4, $5)', 
    [nombre, `${Date.now()}@huerto.com`, '123', 'baja', 'mantener']);
    res.json({ status: "ok" });
});

app.post('/nueva-observacion', async (req, res) => {
    const { usuario_id, altura, estado, notas } = req.body;
    await pool.query('INSERT INTO seguimiento_lavanda (usuario_id, altura_cm, estado_salud, observaciones) VALUES ($1, $2, $3, $4)', 
    [usuario_id, altura, estado, notas]);
    res.json({ status: "ok" });
});

app.get('/lavandas_json', async (req, res) => {
    const query = await pool.query(`SELECT s.*, u.nombre FROM seguimiento_lavanda s JOIN usuarios u ON s.usuario_id = u.id ORDER BY s.fecha DESC`);
    res.json(query.rows);
});

app.delete('/admin/borrar-usuario/:id', async (req, res) => {
    await pool.query('DELETE FROM seguimiento_lavanda WHERE usuario_id = $1', [req.params.id]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ status: "ok" });
});

app.listen(process.env.PORT || 3000);