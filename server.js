const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // CRUCIAL: Para que el servidor entienda datos JSON enviados desde el HTML

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 1. ENDPOINT: Obtener mensaje de bienvenida (el que ya tenías)
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT texto FROM mensaje_final');
        res.json(query.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ENDPOINT: Registro de Usuarios (Sana Alimentación)
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, email, password, peso, altura]
        );
        res.json({ mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "El email ya existe o hay un error en los datos" });
    }
});

// 3. ENDPOINT: Iniciar Sesión (Login)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
        if (user.rows.length > 0) {
            res.json(user.rows[0]); // Devolvemos todos los datos para calcular el IMC en el HTML
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. ENDPOINT: Seguimiento de Lavandas (Huerto)
app.get('/lavandas', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC');
        res.json(query.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor profesional activo en puerto ${PORT}`));