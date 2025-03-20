import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main route to fetch SEO data at the root URL
app.get('/', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.json({ message: 'Please provide a ?url= parameter' });
  }

  try {
    const response = await fetch(url);
    const body = await response.text();
    const titleMatch = body.match(/<title>(.*?)<\/title>/);
    const descriptionMatch = body.match(/<meta name="description" content="(.*?)">/);

    const pageContent = {
      url: url,
      title: titleMatch ? titleMatch[1] : 'No Title Found',
      description: descriptionMatch ? descriptionMatch[1] : 'No Description Found',
      userIntent: {
        query: req.query.query || 'What is the content of this page?',
        intent: 'informational',
        context: 'User is trying to understand the content of the provided URL'
      },
      content: body
    };

    res.json(pageContent);
  } catch (error) {
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});