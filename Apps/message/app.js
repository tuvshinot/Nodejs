const express = require('express');
const app = express();
const io = require('socket.io');

app.get('/', (req, res, next) => {
    res.send("<h1>Hello world!<h1>");
});



var server = app.listen(3030);
io = io.listen(server);

