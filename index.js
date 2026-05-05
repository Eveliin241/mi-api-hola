// BUSCAR OBSERVACIONES (Para el Historial)
app.get('/lavandas_json', async (req, res) => {
    try {
        // Hacemos un JOIN para traer el nombre del usuario junto con la observación
        const result = await pool.query(`
             antiquity.nombre, o.* FROM observaciones o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GUARDAR NUEVA OBSERVACIÓN
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
        console.error(err);
        res.status(500).send("Error al guardar: " + err.message);
    }
});

// ELIMINAR OBSERVACIÓN
app.delete('/eliminar-observacion/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM observaciones WHERE id = $1', [req.params.id]);
        res.json({ message: "Borrado" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});