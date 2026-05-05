require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for development
    methods: ["GET", "POST"]
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// Get messages for a specific room
app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { sender, text, room } = data;
      const newMessage = new Message({ sender, text, room });
      await newMessage.save();
      
      // Emit to everyone in the room
      io.to(room).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Real-world Chat Server on port ${PORT}`));
