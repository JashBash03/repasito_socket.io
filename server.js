const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send existing messages to the user
  db.all("SELECT user, message FROM messages ORDER BY timestamp", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    rows.forEach((row) => {
      socket.emit('chat message', { user: row.user, text: row.message });
    });
  });

  socket.on('set user name', (userName) => {
    socket.userName = userName;
    console.log(`${userName} connected`);
    socket.emit('user name set', userName);

    db.run("INSERT INTO users (name) VALUES (?)", [userName], (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  socket.on('chat message', (msg) => {
    if (socket.userName) {
      io.emit('chat message', { user: socket.userName, text: msg });

      db.run("INSERT INTO messages (user, message) VALUES (?, ?)", [socket.userName, msg], (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userName) {
      console.log(`${socket.userName} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});