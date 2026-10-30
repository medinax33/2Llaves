const { sql } = require('@vercel/postgres');
const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));

async function initDB() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS productos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            categoria VARCHAR(100),
            precio NUMERIC(10, 2) NOT NULL,
            costo NUMERIC(10, 2) NOT NULL,
            stock INT NOT NULL,
            foto TEXT
        );`;

        await sql`CREATE TABLE IF NOT EXISTS transacciones (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(50) NOT NULL, -- 'VENTA', 'DEUDA', 'COBRANZA'
            tercero VARCHAR(255),
            detalles TEXT,
            monto_usd NUMERIC(10, 2) NOT NULL,
            estado VARCHAR(50) DEFAULT 'PENDIENTE',
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;
        console.log("Base de datos inicializada correctamente");
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
    }
}
initDB();

// --- RUTAS DE PRODUCTOS ---
app.get('/api/productos', async (req, res) => {
    try {
        const { rows } = await sql`SELECT * FROM productos ORDER BY id DESC;`;
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, categoria, precio, costo, stock, foto } = req.body;
        const result = await sql`
            INSERT INTO productos (nombre, categoria, precio, costo, stock, foto)
            VALUES (${nombre}, ${categoria}, ${precio}, ${costo}, ${stock}, ${foto})
            RETURNING *;
        `;
        res.json({ success: true, producto: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await sql`DELETE FROM productos WHERE id = ${id};`;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE TRANSACCIONES ---
app.get('/api/transacciones', async (req, res) => {
    try {
        const { tipo } = req.query;
        let rows;
        if (tipo) {
            rows = await sql`SELECT * FROM transacciones WHERE tipo = ${tipo} ORDER BY id DESC;`;
        } else {
            rows = await sql`SELECT * FROM transacciones ORDER BY id DESC;`;
        }
        res.json(rows.rows || rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transacciones', async (req, res) => {
    try {
        const { tipo, tercero, detalles, monto_usd, estado } = req.body;
        const result = await sql`
            INSERT INTO transacciones (tipo, tercero, detalles, monto_usd, estado)
            VALUES (${tipo}, ${tercero}, ${detalles}, ${monto_usd}, ${estado || 'PENDIENTE'})
            RETURNING *;
        `;
        res.json({ success: true, transaccion: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/transacciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        await sql`UPDATE transacciones SET estado = ${estado} WHERE id = ${id};`;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
