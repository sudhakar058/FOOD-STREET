// Cart Logic
let cart = [];
let total = 0;
let discount = 0;
let tableNumber = null;

function addToCart(item, price) {
    cart.push({ item, price });
    total += price;
    updateCart();
}

function updateCart() {
    const cartList = document.getElementById('cart');
    cartList.innerHTML = cart.map(i => `<li>${i.item} - ₹${i.price}</li>`).join('');
    document.getElementById('total').textContent = total;
}

// Place Order
async function placeOrder() {
    const tableInput = document.getElementById('table-number').value;
    if (cart.length === 0) {
        alert('Cart is empty! Please add items to place an order.');
        return;
    }
    if (!tableInput || tableInput < 1) {
        alert('Please enter a valid table number!');
        return;
    }
    tableNumber = parseInt(tableInput);

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNumber, items: cart, total, discount })
        });
        const result = await response.json();
        alert(`Order placed successfully for Table ${tableNumber}! Order ID: ${result.order._id}`);
        showSection('game-selection');
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Failed to place order. Please try again.');
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    const targetSection = document.getElementById(sectionId);
    targetSection.classList.remove('hidden');
    if (sectionId === 'sudoku' && !localStorage.getItem('gamePlayed')) {
        loadSudoku();
    }
    if (sectionId === 'foodcatcher' && localStorage.getItem('gamePlayed')) {
        alert('You have already played a game for this order!');
        showSection('payment');
    }
    if (sectionId === 'payment') {
        displayPaymentDetails();
    }
    if (sectionId === 'feedback') {
        loadFeedbackHistory();
    }
}

// Sudoku Logic
const initialPuzzle = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
];

function loadSudoku() {
    if (localStorage.getItem('gamePlayed')) {
        alert('You have already played a game for this order!');
        showSection('payment');
        return;
    }
    const grid = document.getElementById('sudoku-grid');
    if (!grid) {
        console.error('Sudoku grid element not found!');
        return;
    }
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('input');
            cell.className = 'sudoku-cell';
            cell.type = 'number';
            cell.min = 1;
            cell.max = 9;
            cell.value = initialPuzzle[i][j] || '';
            if (initialPuzzle[i][j]) cell.disabled = true;
            grid.appendChild(cell);
        }
    }
}

async function checkSudoku() {
    const grid = document.getElementById('sudoku-grid').children;
    let board = [];
    let index = 0;

    for (let i = 0; i < 9; i++) {
        let row = [];
        for (let j = 0; j < 9; j++) {
            const value = grid[index].value;
            if (!value || value < 1 || value > 9) {
                document.getElementById('sudoku-result').textContent = 'Please fill all cells with numbers 1-9.';
                return;
            }
            row.push(parseInt(value));
            index++;
        }
        board.push(row);
    }

    for (let i = 0; i < 9; i++) {
        if (!isValidUnit(board[i])) {
            document.getElementById('sudoku-result').textContent = 'Invalid row detected.';
            return;
        }
    }

    for (let j = 0; j < 9; j++) {
        let column = [];
        for (let i = 0; i < 9; i++) {
            column.push(board[i][j]);
        }
        if (!isValidUnit(column)) {
            document.getElementById('sudoku-result').textContent = 'Invalid column detected.';
            return;
        }
    }

    for (let row = 0; row < 9; row += 3) {
        for (let col = 0; col < 9; col += 3) {
            let grid3x3 = [];
            for (let i = row; i < row + 3; i++) {
                for (let j = col; j < col + 3; j++) {
                    grid3x3.push(board[i][j]);
                }
            }
            if (!isValidUnit(grid3x3)) {
                document.getElementById('sudoku-result').textContent = 'Invalid 3x3 grid detected.';
                return;
            }
        }
    }

    discount = 100;
    localStorage.setItem('gamePlayed', 'true');
    alert('Congratulations! You won ₹100 off!');
    total = Math.max(0, total - discount);
    updateCart();
    showSection('payment');
}

function isValidUnit(unit) {
    let seen = new Set();
    for (let num of unit) {
        if (seen.has(num)) return false;
        seen.add(num);
    }
    return true;
}

// Food Catcher Logic
let score = 0;
let gameActive = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const plate = { x: 180, y: 550, width: 40, height: 10 };
const foods = [];
const speed = 2;

function startGame() {
    if (localStorage.getItem('gamePlayed')) {
        alert('You have already played a game for this order!');
        showSection('payment');
        return;
    }
    score = 0;
    foods.length = 0;
    gameActive = true;
    document.getElementById('score').textContent = score;
    spawnFood();
    gameLoop();
}

function spawnFood() {
    const x = Math.random() * (canvas.width - 20);
    foods.push({ x, y: 0, type: Math.random() > 0.5 ? 'food' : 'bomb' });
}

function gameLoop() {
    if (!gameActive || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'blue';
    ctx.fillRect(plate.x, plate.y, plate.width, plate.height);

    for (let i = foods.length - 1; i >= 0; i--) {
        foods[i].y += speed;
        ctx.fillStyle = foods[i].type === 'food' ? 'green' : 'red';
        ctx.fillRect(foods[i].x, foods[i].y, 20, 20);

        if (
            foods[i].y + 20 > plate.y &&
            foods[i].x > plate.x - 20 &&
            foods[i].x < plate.x + plate.width
        ) {
            if (foods[i].type === 'food') score += 10;
            else gameActive = false;
            foods.splice(i, 1);
        } else if (foods[i].y > canvas.height) {
            foods.splice(i, 1);
        }
    }

    document.getElementById('score').textContent = score;
    if (Math.random() < 0.02) spawnFood();

    if (gameActive) requestAnimationFrame(gameLoop);
    else {
        let reward = 0;
        if (score >= 150) {
            reward = 10;
            discount = reward;
            total = Math.max(0, total - discount);
        }
        localStorage.setItem('gamePlayed', 'true');
        alert(`Game Over! Score: ${score}. Discount: ₹${reward}`);
        updateCart();
        showSection('payment');
    }
}

if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
        plate.x = e.offsetX - plate.width / 2;
        if (plate.x < 0) plate.x = 0;
        if (plate.x > canvas.width - plate.width) plate.x = canvas.width - plate.width;
    });
}

// Payment Logic
function displayPaymentDetails() {
    const paymentDetails = document.getElementById('payment-details');
    paymentDetails.innerHTML = `
        <h2>Order Summary</h2>
        <p>Table Number: ${tableNumber}</p>
        <ul>${cart.map(i => `<li>${i.item} - ₹${i.price}</li>`).join('')}</ul>
        <p>Subtotal: ₹${total + discount}</p>
        <p>Discount Applied: ₹${discount}</p>
        <p><strong>Total: ₹${total}</strong></p>
    `;
}

function processPayment() {
    alert('Payment processed successfully! Thank you for your order.');
    showSection('feedback');
    cart = [];
    total = 0;
    discount = 0;
    tableNumber = null;
    localStorage.removeItem('gamePlayed');
    updateCart();
    document.getElementById('table-number').value = '';
}

// Feedback Logic
async function submitFeedback(event) {
    event.preventDefault();
    const name = document.getElementById('name').value || 'Anonymous';
    const rating = document.getElementById('rating').value;
    const comments = document.getElementById('comments').value;

    if (!comments) {
        alert('Please provide some feedback!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rating: parseInt(rating), comments })
        });
        const result = await response.json();
        alert(`Thank you, ${name}! Your feedback (Rating: ${rating}/5) has been submitted.\nComments: ${comments}`);
        document.getElementById('name').value = '';
        document.getElementById('rating').value = 3;
        document.getElementById('comments').value = '';
        document.querySelector('.rating-value').textContent = '3';
        showSection('landing');
    } catch (error) {
        console.error('Error saving feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    }
}

async function loadFeedbackHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/feedback');
        const feedback = await response.json();
        const historyDiv = document.getElementById('feedback-history');
        if (historyDiv) {
            historyDiv.innerHTML = feedback.map(f => `
                <div class="feedback-item">
                    <p><strong>${f.name || 'Anonymous'}</strong> (Rating: ${f.rating || 0}/5)</p>
                    <p>${f.comments || 'No comments'}</p>
                    <p><em>${new Date(f.timestamp).toLocaleString()}</em></p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const ratingInput = document.getElementById('rating');
    const ratingValue = document.querySelector('.rating-value');
    if (ratingInput && ratingValue) {
        ratingInput.addEventListener('input', () => {
            ratingValue.textContent = ratingInput.value;
        });
    }
    showSection('landing');
});
