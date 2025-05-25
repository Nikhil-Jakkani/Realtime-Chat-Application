const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const colors = require('colors');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const path=require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to the database
connectDB();

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:4000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Increase header size limit
const http = require('http');
const httpServer = http.createServer({
    maxHeaderSize: 81920, // 80KB
}, app);

// Routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// --------------------------Deployment------------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "/frontend/build")));
    app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
    );
} else {
    app.get("/", (req, res) => {
        res.send("API is running on port 5000");
    });
}
// --------------------------Deployment------------------------------

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const port = 5000;

// Start the server
const startServer = async () => {
    let currentPort = port;
    let maxAttempts = 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const server = await new Promise((resolve, reject) => {
                const srv = httpServer.listen(currentPort, '0.0.0.0', () => {
                    console.log(`Server is running at port ${currentPort}`.yellow.bold);
                    resolve(srv);
                }).on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`.yellow);
                        currentPort++;
                        reject(err);
                    } else {
                        reject(err);
                    }
                });
            });
            return server;
        } catch (err) {
            if (attempt === maxAttempts) {
                console.error(`Could not find an available port after ${maxAttempts} attempts`.red);
                process.exit(1);
            }
        }
    }
};

const server = startServer();

// Set up Socket.io
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;
            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});
