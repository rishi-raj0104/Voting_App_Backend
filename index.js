const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');
require('dotenv').config();
const bodyParser = require('body-parser'); 
app.use(cors({
    origin: ['http://localhost:5173', 'https://voting-app-kappa-inky.vercel.app'],
    credentials: true, 
  }));
app.use(bodyParser.json());

const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);
app.get('/', (req, res) => {
    res.send('Welcome to Express!');
});

app.listen(process.env.PORT, ()=>{
    console.log(`listening on port ${process.env.PORT}`);
})