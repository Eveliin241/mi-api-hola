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

// --- 1. ENDPOINT DE BIENVENIDA (Muestra la última lavanda) ---
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        if (query.rows.length > 0) {
            res.json({ mensaje: "Estado del huerto: " + query.rows[0].observaciones });
        } else {
            res.json({ mensaje: "Sistema de Salud y Lavandas Activo." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. ENDPOINT: REGISTRO DE USUARIOS (9 CAMPOS) ---
app.post('/registrar', async (req, res) => {
    // Extraemos los 9 campos del cuerpo de la petición
    const { nombre, email, password, peso, altura, edad, actividad_fisica, objetivo } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nombre, email, password, peso, altura, edad, actividad_fisica, objetivo]
        );
        res.json({ mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
    } catch (err) {
        console.error(err); // Esto te ayuda a ver errores en la terminal de Render
        res.status(500).json({ error: "Error en el registro. Verifica si el email ya existe." });
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

// --- 4. ENDPOINT: VER HISTORIAL DE LAVANDAS ---
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