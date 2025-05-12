// src/models/color.model.ts
import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';
import { IColor } from '../interfaces/color.interface';

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes): ModelStatic<Model<IColor>> {
  const Color = sequelize.define<Model<IColor>>('Color', {
    id: {
      type: dataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    nombre: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    codigo_color: {
      type: dataTypes.STRING,
      allowNull: true,
    }
  }, {
    modelName: 'Color',
    tableName: 'colors',
    timestamps: true,
    underscored: false,
    paranoid: false,
    freezeTableName: true,
  });

  (Color as any).associate = function(models: any) {
    if (models.ProductColor && models.Product) {
      // Un color puede estar asociado a muchos productos
      Color.belongsToMany(models.Product, {
        through: models.ProductColor,
        foreignKey: 'color_id',
        otherKey: 'product_id',
        as: 'products'
      });
    }
  };

  return Color;
}