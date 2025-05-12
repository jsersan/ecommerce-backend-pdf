// src/models/index.ts
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar definiciones de modelos
import productModel from './product.model';
import categoryModel from './category.model';
// Comentamos esta importación
// import productColorModel from './product-color.model';

// Crear instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS!, 
  {
    host: process.env.DB_HOST!,
    dialect: 'mysql',
    logging: console.log
  }
);

// Crear objeto de base de datos
const db: any = {
  sequelize,
  Sequelize,
  Product: productModel(sequelize, DataTypes),
  Category: categoryModel(sequelize, DataTypes),
  // No incluimos ProductColor por ahora
};

// Establecer asociaciones entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;