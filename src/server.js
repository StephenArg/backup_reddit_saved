const path = require('path');
const express = require('express');
const app = express();
const router = require('./lib/router');
const { Server } = require('socket.io');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3001;

// Middleware that parses json and looks at requests where the Content-Type header matches the type option.
app.use(express.json());

// Serve API requests from the router
app.use('/api', router);

// Serve app production bundle
app.use(express.static('dist/app'));

// Handle client routing, return all requests to the app
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'app/index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('run', () => {
    const child = spawn('node', ['src/index.mjs']);
    child.stdout.on('data', function (data) {
      socket.emit('stdOut', data.toString());
    });
    child.on('close', () => {
      socket.emit('stdOut', 'Finished');
    });
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});
