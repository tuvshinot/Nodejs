const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// middleware for just user to create product tempo until sessions
app.use((req, res, next) => {
  User.findByPk(1)
  .then(user => {
    req.user = user;
    next();
  })
  .catch(err => console.log(err));
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

// relationship association
Product.belongsTo(User, {constraints : true, onDelete : 'CASCADE'})
User.hasMany(Product);

// one to one
User.hasOne(Cart);
Cart.belongsTo(User);

// many to many relation ship and this stores them in cartItem
Cart.belongsToMany(Product, {through : CartItem});
Product.belongsToMany(Cart, {through : CartItem});

// one to many
Order.belongsTo(User);
User.hasMany(Order);

// many to many
Order.belongsToMany(Product, {through : OrderItem});
// Product.belongsToMany(Order,  {through : OrderItem}); optional

// initialzation code runs first 
sequelize
  // .sync({force:true})
  .sync()
  .then(result => {
    return User.findByPk(1);
    // console.log(result);
  })
  .then(user => {
    if(!user) {
      User.create({username : 'tuvshin', email : 'ronin.xe@com'});
    }
    return user;
  })
  .then(user => {
    return user.createCart();
  })
  .then(cart => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
