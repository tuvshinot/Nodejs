const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
// for windows only file uploading naming convention
const uuidv4 = require('uuid/v4');
const multer = require('multer');

const app = express();
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const MONGODB_URI = 'mongodb+srv://tuvshinClient:Tuwshin99@udemy-vp6wh.gcp.mongodb.net/RestApi';

// images storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        const exten = file.originalname.split('.')[1];
        cb(null, uuidv4() + '.' + exten);
    }
});
// file filter
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};


// app.use(bodyParser.urlencoded({})) // that`s for x-www-form-urlencoded <form>
app.use(bodyParser.json()); //application/json
// serving statically in image folder
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'));


// solving CORS error
// allowing us to send request from other domain/hosts
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
///

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use((req, res, next) => {
    res.json({message: 'API request Not Found!'});
});



app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    res.status(status).json({ message: message , data: error.data });
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        const server = app.listen(8080);
        console.log('Mongoose Connected...');
        const io = require('./socket').init(server);
        io.on('connection', socket => {
            console.log('Client Connected...');
        });
    })
    .catch(err => console.log(err));