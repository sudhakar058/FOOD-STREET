const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/foodstreet')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Order Schema
const orderSchema = new mongoose.Schema({
    tableNumber: Number,
    items: [{ item: String, price: Number }],
    total: Number,
    discount: Number,
    timestamp: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    name: String,
    rating: Number,
    comments: String,
    timestamp: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// API to Save an Order
app.post('/api/orders', async (req, res) => {
    const { tableNumber, items, total, discount } = req.body;
    const order = new Order({ tableNumber, items, total, discount });
    await order.save();
    res.json({ message: 'Order saved successfully', order });
});

// API to Get All Orders
app.get('/api/orders', async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
});

// API to Save Feedback
app.post('/api/feedback', async (req, res) => {
    const { name, rating, comments } = req.body;
    const feedback = new Feedback({ name, rating, comments });
    await feedback.save();
    res.json({ message: 'Feedback saved successfully', feedback });
});

// API to Get All Feedback
app.get('/api/feedback', async (req, res) => {
    const feedback = await Feedback.find();
    res.json(feedback);
});

app.listen(3000, () => console.log('Server running on port 3000'));
