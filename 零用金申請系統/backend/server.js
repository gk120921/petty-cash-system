const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// 1. Import Core Modules
const db = require('./database');
const { getConfig } = require('./config/configManager');

// 2. Import Services
const ExcelService = require('./services/excelService');
const AuthService = require('./services/authService');

const excelService = new ExcelService(db);
const authService = new AuthService(db);

// 3. Import Routes
const systemRoutes = require('./routes/systemRoutes');
const personnelRoutes = require('./routes/personnelRoutes')(db, authService);
const supplierRoutes = require('./routes/supplierRoutes')(db);
const expenseRoutes = require('./routes/expenseRoutes')(db, excelService);
const categoryRoutes = require('./routes/categoryRoutes')(db);

const app = express();
const PORT = process.env.PORT || 3000;

// 4. Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Mount Routes
app.use('/api', systemRoutes);
app.use('/api', personnelRoutes);
app.use('/api', supplierRoutes);
app.use('/api', expenseRoutes);
app.use('/api', categoryRoutes);

// 6. Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================`);
  console.log(`🚀 Petty Cash Server (Modular) is running!`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`📡 Network: Accessible via your local IP`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`================================================`);
});
