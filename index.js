const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
// Límite aumentado para que las fotos en Base64 no bloqueen el servidor
app.use(express.json({ limit: '10mb' })); 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// HISTORIAL: Con el JOIN correcto para evitar errores de referencia
app.get('/lavandas_json', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.nombre, o.* FROM observaciones o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GUARDAR: Sincronizado con los nombres de tu nueva tabla en pgAdmin
app.post('/nueva-observacion', async (req, res) => {
    const { usuario_id, altura, ancho_cm, estado, observaciones, imagen } = req.body;
    try {
        await pool.query(
            `INSERT INTO observaciones (usuario_id, altura_cm, ancho_cm, estado_salud, observaciones, foto_base64) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuario_id, altura, ancho_cm, estado, observaciones, imagen]
        );
        res.json({ message: "Guardado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GESTIÓN DE USUARIOS
app.get('/lista-usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/registrar', async (req, res) => {
    try {
        await pool.query('INSERT INTO usuarios (nombre) VALUES ($1)', [req.body.nombre]);
        res.json({ message: "Usuario registrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/eliminar-usuario/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ELIMINAR OBSERVACIÓN (Para el modo Admin)
app.delete('/eliminar-observacion/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM observaciones WHERE id = $1', [req.params.id]);
        res.json({ message: "Borrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUERTO: Obligatorio para que Render no dé error de Status 1
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Botánica OS activa en puerto ${PORT}`);
});