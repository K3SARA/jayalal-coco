require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Log HTTP requests
app.use(morgan('dev'));

// Parse JSON request body
app.use(express.json());

// Mount APIs
app.use('/api', routes);

// Serve Static Frontend Assets in Production
const clientDistPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientDistPath));

// Catch-all route to serve Vite index.html in production
app.get('*', (req, res, next) => {
  // If it looks like an API call but isn't matched, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Otherwise serve static index.html
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development, Vite handles static index.html
      res.status(200).send('Jayalal Coco Backend running. Start Vite dev server for frontend.');
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` Jayalal Coco server started!`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
});
