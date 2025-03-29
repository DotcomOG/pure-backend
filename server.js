import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the Public folder
app.use(express.static(path.join(__dirname, 'Public')));

// Optional: Default route to serve main.html (adjust if needed)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'main.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});