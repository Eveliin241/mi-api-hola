const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Necesario para recibir datos de registro

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- 1. ENDPOINT DE BIENVENIDA (HISTÓRICO) ---
app.get('/datos', async (req, res) => {
    try {
        // Consultamos la tabla de lavandas en lugar del mensaje viejo para que se actualice la web
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        if (query.rows.length > 0) {
            res.json({ mensaje: "Estado actual del huerto: " + query.rows[0].observaciones });
        } else {
            res.json({ mensaje: "Bienvenido al sistema de salud y huerto escolar." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. ENDPOINT: REGISTRO DE USUARIOS ---
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura, edad, actividad_fisica } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nombre, email, password, peso, altura, edad, actividad_fisica]
        );
        res.json({ mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Error en el registro o email duplicado" });
    }
});

// --- 3. ENDPOINT: LOGIN ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
        if (user.rows.length > 0) {
            res.json(user.rows[0]);
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. ENDPOINT: VER TODO EL HUERTO (LAVANDAS) ---
app.get('/lavandas', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC');
        res.json(query.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));