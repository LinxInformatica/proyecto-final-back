const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const {
  DB_USER, DB_PASSWORD, DB_HOST, DIALECT_OPTIONS, SSL, DB_NAME
} = process.env;

const sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`,
  {
    force: true,
    logging: false,
    native: false,
    dialect: 'postgres',
    ssl: SSL,
    define: {
      freezeTableName: true,
      timestamps: false,
    },
    dialectOptions: JSON.parse(DIALECT_OPTIONS),
    query: {
      raw: true, // Establece raw: true globalmente
    },
  }
);

const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach(model => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { Categories_options, Categories, People_logins, People_options, People, Opportunities, Chats, Payments } = sequelize.models;

// Relaciones

People.belongsToMany(Categories_options,
  {
    through: People_options,
    foreignKey: 'idPeople'
  });

Categories_options.belongsToMany(People,
  {
    through: People_options,
    foreignKey: 'idOption'
  });

People.hasOne(Categories_options, {
  foreignKey: 'idGenre'
})

Categories_options.belongsTo(People)

Categories.hasMany(Categories_options, {
  foreignKey: 'idCategorie'
})

People.hasMany(People_logins, {
  foreignKey: 'idPeople'
})

People.hasMany(Payments, {
  foreignKey: 'idPeople'
})

People.hasMany(Opportunities, {
  foreignKey: 'idCustomer'
})

People.hasMany(Opportunities, {
  foreignKey: 'idProvider'
})

Opportunities.hasMany(Chats, {
  foreignKey: 'idOpportunities'
})

module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
};
