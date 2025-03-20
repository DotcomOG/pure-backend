import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

// Root route expects a ?url= parameter
app.get('/', async (req, res) => {
  const targetUrl = req.query.url;

  // If no URL is provided, return a helpful message
  if (!targetUrl) {
    return res.json({ message: 'Please provide a ?url= parameter' });
  }

  try {
    // Fetch the external URL's content
    const response = await fetch(targetUrl);
    const body = await response.text();

    // Attempt to extract <title> and meta description
    const titleMatch = body.match(/<title>(.*?)<\/title>/);
    const descriptionMatch = body.match(/<meta name="description" content="(.*?)">/);

    const pageContent = {
      url: targetUrl,
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
    // Log the error to Railway logs for debugging
    console.error('Error fetching URL:', error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

// Start the server on port 8080 or assigned PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});