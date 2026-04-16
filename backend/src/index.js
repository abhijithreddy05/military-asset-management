const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const inventoryRoutes = require('./routes/inventory');
const transactionsRoutes = require('./routes/transactions');
const basesRoutes = require('./routes/bases');

const app = express();
app.use(cors());
app.use(express.json());

initDb();

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/bases', basesRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
