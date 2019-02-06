const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('5c1237253b73030f8466441e')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect('mongodb+srv://tuvshin:Tuwshin99@cluster0-fps6d.mongodb.net/shop?retryWrites=true')
  .then(result => {
    User
    .findOne()
    .then(user => {
      if(!user) {
        const user = new User({
          name:'Tuvshin',
          email: 'name@yahoo',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    console.log('Connected');
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
