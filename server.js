const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

// Render nos dará una "Internal Database URL"
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Obligatorio para conexiones seguras en la nube
});

app.get('/datos', async (req, res) => {
    try {
        const query = await pool.query('SELECT texto FROM mensaje_final');
        res.json(query.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// El puerto lo decide Render automáticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));