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

// 1. RUTA DE BIENVENIDA (Lo que se ve al abrir el link de Render)
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #4CAF50;">🌿 API Salud & Lavanda v2.0</h1>
            <p>Estado del Servidor: <span style="color: green;"><b>OPERATIVO</b></span></p>
            <p style="color: #666;">La base de datos PostgreSQL está conectada correctamente.</p>
        </div>
    `);
});

// 2. ENDPOINT DE DATOS (Estado actual del huerto)
app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC LIMIT 1');
        res.json({
            status: "success",
            timestamp: new Date(),
            data: query.rows[0] || { observaciones: "Sin registros de lavanda aún" }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 3. ENDPOINT DE HISTORIAL (Para la lista del final de la página)
app.get('/lavandas', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC');
        res.json(query.rows);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 4. REGISTRO CON MANEJO DE ERRORES PROFESIONAL
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura, edad, actividad_fisica, objetivo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre, email',
            [nombre, email, password, peso, altura, edad, actividad_fisica, objetivo]
        );
        res.status(201).json({ status: "success", usuario: result.rows[0] });
    } catch (err) {
        // Error de Check Constraint (23514)
        if (err.code === '23514') {
            res.status(400).json({ status: "error", message: "Error: Datos de actividad u objetivo fuera de rango." });
        } else if (err.code === '23505') { // Error de Email Duplicado
            res.status(400).json({ status: "error", message: "Este correo electrónico ya está registrado." });
        } else {
            res.status(500).json({ status: "error", message: "Error interno del servidor." });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Sistemas de Salud y Lavanda activos.'));