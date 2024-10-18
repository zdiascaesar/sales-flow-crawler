const express = require('express');
const { processEmailQueue } = require('./emailHandler');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Email processing function
async function startEmailProcessing(intervalMinutes = 5) {
  console.log('Starting email processing...');
  setInterval(async () => {
    console.log('Processing email queue...');
    await processEmailQueue();
  }, intervalMinutes * 60 * 1000);
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Start the email processing in the background
  startEmailProcessing();
});

module.exports = app; // Export the app for testing or further use
