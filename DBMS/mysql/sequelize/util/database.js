const Sequelize = require('sequelize');

const sequelize = new Sequelize('nodejs', 'root', 'tuvshinot', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
