const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
// for windows only file uploading naming convention
const uuidv4 = require('uuid/v4');
const multer = require('multer');

const app = express();
const MONGODB_URI = 'mongodb+srv://tuvshinClient:Tuwshin99@udemy-vp6wh.gcp.mongodb.net/GraphQLApi';
const graphHttp = require('express-graphql');
const graphqlSchema = require('./graphQL/schema');
const graphqlResolvers = require('./graphQL/resolvers');

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
    if(req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
///

// app.use((req, res, next) => {
//     res.json({message: 'API request Not Found!'});
// });


app.use('/graphql', graphHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    formatError(err) {
        if(!err.originalError) {
            return err; // error from client
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occured';
        const code = err.originalError.code || 500;
        return {message: message, status: code, data: data};
    }
}));

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    res.status(status).json({ message: message , data: error.data });
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(8080);
        console.log('Mongoose Connected...');
    })
    .catch(err => console.log(err));