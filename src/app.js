const express = require('express');
const app = express();
env = require('dotenv').config();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index');
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

