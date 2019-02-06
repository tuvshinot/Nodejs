const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findAll({ where: { id: prodId } })
    .then(products => {
      res.render('shop/product-detail', {
        product: products[0],
        pageTitle: products[0].title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
  // Product.findByPk(prodId)
  //   .then(product => {
  //     res.render('shop/product-detail', {
  //       product: product,
  //       pageTitle: product.title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
};

// / route
exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

// /cart
exports.getCart = (req, res, next) => {
  req.user
  .getCart()
  .then(cart => {
    return cart.getProducts();
  })
  .then(products => {
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products
    });
  })
  .catch(err => console.log(err));
};

// add item to cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQty = 1;

  req.user
  .getCart() // checking product already there
  .then(cart => {
    fetchedCart = cart;
    return cart.getProducts({where : {id : prodId} });
  })
  .then(products => {
    let product;
    if(products.length > 0) {
      product = products[0];
    }

    // if there is a product
    if(product) {
      const oldQty = product.cartItem.quantity;
      newQty = oldQty + 1;

      return product;
    }

    return Product.findByPk(prodId);
      
  })
  // data will be new or existing
  .then(product => {
    return fetchedCart.addProduct(product, {
      through : { quantity : newQty}
    });
  })
  .then(() => {
    res.redirect('/cart');
  })
  .catch(err => console.log(err))
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
  .getCart()
  .then(cart => {
    return cart.getProducts({where : {id : prodId} });
  })
  .then(products => {
       const product = products[0];
       return product.cartItem.destroy();
  })
  .then(() => {
    res.redirect('/cart');
  })
  .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  req.user
  .getOrders({ include: [{ model: Product }] }) // cuz in Product model we have product table - sequelize pluralized it fetching order with products 
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders : orders
    });
  })
  .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
  .getCart()
  .then(cart => {
    fetchedCart = cart;
    return cart.getProducts();
  })
  .then(products => {
    // console.log(products);
    return req.user
    .createOrder()
    .then(order => {
      return order.addProducts(products.map(prod => {
        prod.orderItem = {quantity : prod.cartItem.quantity };
        return prod;
      }));
    })
    .catch(err => console.log(err));
  })
  .then(result => {
    return fetchedCart.setProducts(null);
  })
  .then(result => {
    res.redirect('/orders');
  })
  .catch(err => console.log(err));
}
