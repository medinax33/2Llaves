// Agrega esta tabla en la función initDB() dentro de api/server.js:
await sql`CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);`;

// Y añade estos endpoints en el servidor:
app.get('/api/tasa', async (req, res) => {
    try {
        const { rows } = await sql`SELECT valor FROM configuracion WHERE clave = 'tasa_bcv';`;
        if (rows.length > 0) {
            res.json({ tasa: parseFloat(rows[0].valor) });
        } else {
            res.json({ tasa: 36.50 }); // Valor por defecto inicial
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasa', async (req, res) => {
    try {
        const { tasa } = req.body;
        await sql`
            INSERT INTO configuracion (clave, valor) VALUES ('tasa_bcv', ${tasa})
            ON CONFLICT (clave) DO UPDATE SET valor = ${tasa};
        `;
        res.json({ success: true, tasa });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
