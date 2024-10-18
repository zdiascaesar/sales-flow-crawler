process.stdout.write('Test script started\n');

const fs = require('fs');

try {
  fs.writeFileSync('test.log', 'Test log entry\n');
  process.stdout.write('Log file written\n');
} catch (error) {
  process.stdout.write(`Error writing to file: ${error.message}\n`);
}

// Add a delay to keep the script running
setTimeout(() => {
  process.stdout.write('Test script completed after delay\n');
}, 5000);  // 5 second delay

process.stdout.write('Test script execution continuing...\n');
