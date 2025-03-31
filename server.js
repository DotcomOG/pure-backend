import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log __dirname for debugging
console.log("Server __dirname:", __dirname);

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Define route for the root - serves main.html
app.get('/', (req, res) => {
  const mainFile = path.join(__dirname, 'public', 'main.html');
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// Define route for input.html explicitly (if needed)
app.get('/input.html', (req, res) => {
  const inputFile = path.join(__dirname, 'public', 'input.html');
  if (fs.existsSync(inputFile)) {
    res.sendFile(inputFile, (err) => {
      if (err) {
        console.error("Error sending input.html:", err);
        res.status(500).send("Error loading page.");
      }
    });
  } else {
    res.status(404).send("input.html not found.");
  }
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});