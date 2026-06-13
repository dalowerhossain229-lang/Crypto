const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// App Initialization
const app = express();
app.use(cors()); // Cross-Origin Resource Sharing এনাবল করার জন্য
app.use(express.json());

const server = http.createServer(app);

// Socket.io Setup with CORS configuration
const io = new Server(server, {
    cors: {
        origin: "*", // টেস্ট করার জন্য সব অরিজিন এলাউ করা হয়েছে, রেন্ডারে দিলে নির্দিষ্ট ডোমেইন দেওয়া যায়
        methods: ["GET", "POST"]
    }
});

// In-Memory Database for Trial (সার্ভার রিস্টার্ট দিলে এই ডাটা মুছে যাবে)
const connectedUsers = new Map(); // ওয়ালেট অ্যাড্রেস এবং সকেট আইডি ট্র্যাকিং

// Basic Route for Testing
app.get('/', (req, res) => {
    res.send({ status: "Server is running perfectly for Crypto MLM trial!" });
});

// Socket.io Core Mechanisms
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // ১. ইউজার ওয়ালেট কানেক্ট করলে সার্ভারে রেজিস্টার করা
    socket.on('register_user', (data) => {
        const walletAddress = data.walletAddress[0].toLowerCase(); // সব অ্যাড্রেস লোয়ারকেস করা হলো
        connectedUsers.set(walletAddress, socket.id);
        console.log(`👤 User Registered: ${walletAddress} with Socket ID: ${socket.id}`);
    });

    // ২. রেফারেল বা নতুন জয়েনিং সিমুলেট করা (Core Payout Logic Sim)
    socket.on('simulate_join', (data) => {
        const uplineRef = data.ref.trim().toLowerCase();
        console.log(`⚡ Simulation Triggered! New user joining under upline: ${uplineRef}`);

        // সিস্টেমে একটি গ্লোবাল ইভেন্ট পাঠানো (সবাই লাইভ লগে দেখতে পাবে)
        io.emit('new_member_joined', { ref: uplineRef });

        // নির্দিষ্ট করে সেই আপলাইনের ড্যাশবোর্ড রিয়েল-টাইমে আপডেট করা (যদি সে অনলাইনে থাকে)
        if (connectedUsers.has(uplineRef)) {
            const uplineSocketId = connectedUsers.get(uplineRef);
            // এখানে ডাটাবেজ থাকলে ব্যালেন্স সেভ হতো, ট্রায়ালে আমরা সরাসরি লাইভ সিগন্যাল পাঠিয়ে দিচ্ছি
            console.log(`🎯 Upline is online. Sending instant commission alert to: ${uplineSocketId}`);
        } else {
            console.log(`💤 Upline ${uplineRef} is currently offline. Payout simulated on blockchain logic.`);
        }
    });

    // ৩. ডিসকানেক্ট হ্যান্ডেল করা
    socket.on('disconnect', () => {
        // ম্যাপ থেকে ডিসকানেক্টেড ইউজারের সকেট আইডি রিমুভ করা
        for (let [wallet, id] of connectedUsers.entries()) {
            if (id === socket.id) {
                connectedUsers.delete(wallet);
                console.log(`❌ User left: ${wallet}`);
                break;
            }
        }
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Render-এর পোর্টের সাথে ম্যাচ করার জন্য কনফিগারেশন
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Real-time MLM Server is running on port ${PORT}`);
});
