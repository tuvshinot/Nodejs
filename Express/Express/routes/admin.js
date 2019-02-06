//core
const path = require('path');

// 3rd
const express = require('express');
const router = express.Router();

// custum
const rootDir = require('../util/path');

// router.use('/', (req, res, next) => {
//     console.log('This always runs');
//     next(); // allows other to run
// });

// admin/add-product - admin added in app.js
router.get('/add-product', (req, res, next) => {
    res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
});

// admin/add-product
router.post('/add-product', (req, res, next) => {
    console.log(req.body);
    res.redirect('/');
});

module.exports = router;