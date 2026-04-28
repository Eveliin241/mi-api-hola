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

// 1. RUTA DE BIENVENIDA (Landing Page Profesional)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Salud & Lavanda | Dashboard</title>
            <style>
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
                }
                body { 
                    margin: 0; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: linear-gradient(135deg, #1d976c 0%, #93f9b9 100%); 
                    height: 100vh; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    overflow: hidden;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border-radius: 25px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 50px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                    max-width: 600px;
                    width: 90%;
                }
                .icon-container {
                    font-size: 80px;
                    display: inline-block;
                    animation: float 4s ease-in-out infinite;
                    margin-bottom: 20px;
                }
                h1 { margin: 0; font-size: 2.8em; letter-spacing: -1px; text-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .badge {
                    display: inline-block;
                    background: #2ecc71;
                    color: white;
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: bold;
                    margin: 15px 0;
                    animation: pulse 2s infinite;
                }
                p { font-size: 1.1em; opacity: 0.9; line-height: 1.6; }
                .btn-group { margin-top: 35px; display: flex; justify-content: center; gap: 20px; }
                .btn {
                    text-decoration: none;
                    color: white;
                    border: 2px solid rgba(255,255,255,0.5);
                    padding: 12px 25px;
                    border-radius: 12px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                .btn:hover {
                    background: white;
                    color: #1d976c;
                    transform: translateY(-3px);
                }
                footer { margin-top: 40px; font-size: 0.8em; opacity: 0.7; }
            </style>
        </head>
        <body>
            <div class="glass-card">
                <div class="icon-container">🌿</div>
                <h1>Salud & Lavanda</h1>
                <div class="badge">API ONLINE</div>
                <p>Bienvenido al núcleo de datos del Proyecto de Nutrición y Huerto Escolar. Sistema de alta disponibilidad conectado a PostgreSQL.</p>
                
                <div class="btn-group">
                    <a href="/datos" class="btn">📊 Ver Estado</a>
                    <a href="/lavandas" class="btn">📅 Historial</a>
                </div>
                
                <footer>
                    Diseñado para el Certamen Estatal | Node.js & PostgreSQL Cloud
                </footer>
            </div>
        </body>
        </html>
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

// 3. ENDPOINT DE HISTORIAL
app.get('/lavandas', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM seguimiento_lavanda ORDER BY fecha DESC');
        res.json(query.rows);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 4. REGISTRO DE USUARIOS
app.post('/registrar', async (req, res) => {
    const { nombre, email, password, peso, altura, edad, actividad_fisica, objetivo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, peso, altura, edad, actividad_fisica, objetivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre, email',
            [nombre, email, password, peso, altura, edad, actividad_fisica, objetivo]
        );
        res.status(201).json({ status: "success", usuario: result.rows[0] });
    } catch (err) {
        if (err.code === '23514') {
            res.status(400).json({ status: "error", message: "Error: Datos de actividad u objetivo fuera de rango." });
        } else if (err.code === '23505') {
            res.status(400).json({ status: "error", message: "Este correo electrónico ya está registrado." });
        } else {
            res.status(500).json({ status: "error", message: "Error interno del servidor." });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Sistemas de Salud y Lavanda activos.'));