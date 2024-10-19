const express = require('express');
const { fetchEmailsFromDB } = require('./fetchEmails');
const { main: sendEmails } = require('./sendEmails');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Combined function to process email queue
async function processEmailQueue() {
  console.log('Processing email queue...');
  try {
    await fetchEmailsFromDB();
    await sendEmails();
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}

// Email processing function
const startEmailProcessing = async (intervalMinutes = 5) => {
  console.log('Starting email processing...');
  setInterval(async () => {
    await processEmailQueue();
  }, intervalMinutes * 60 * 1000);
};

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Start the email processing in the background
  startEmailProcessing();
});

module.exports = app; // Export the app for testing or further use
