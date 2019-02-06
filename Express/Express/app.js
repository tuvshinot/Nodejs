// Core module
const http = require('http');
const path = require('path');

// 3rd party
const express = require('express');
const bodyParser = require('body-parser');

// custum
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

// create server
const app = express();

// parsing set up
app.use(bodyParser.urlencoded({extended: false})); // it has next(); and all body parse things in plain node
// serving static content making public folder accessible from browser
app.use(express.static(path.join(__dirname, 'public')));


// admin routes handlers
app.use('/admin', adminRoutes);

// shop routes
app.use(shopRoutes);

// 404
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'))
});




// port method
app.listen(3000);

// port method
// const server = http.createServer(app);
// server.listen(3000);