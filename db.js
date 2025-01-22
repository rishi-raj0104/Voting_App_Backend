const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.DB_URL,{
    //useNewUrlParser:true,
    //useUnifiedTopology:true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Connection error', err));

// useNewUrlParser: true: Uses the new MongoDB driver's URL parser for improved connection string parsing.
// useUnifiedTopology: true: Enables the new topology engine, which improves connection handling.