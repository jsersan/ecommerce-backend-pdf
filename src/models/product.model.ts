import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';
import { IProduct } from '../interfaces/product.interface';

// Extender la interfaz Model para incluir associate
interface ProductModel extends Model<IProduct>, IProduct {
  associate?: (models: any) => void;
}

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes): ModelStatic<ProductModel> {
  /**
   * Clase Product extendida para incluir métodos virtuales
   */
  class Product extends Model<IProduct> implements IProduct {
    public id!: number;
    public nombre!: string;
    public descripcion!: string;
    public precio!: number;
    public categoria_id!: number;
    public imagen!: string;
    public carpetaimg?: string;
    public categoria?: any;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  
    /**
     * Override del método toJSON para incluir carpetaimg automáticamente
     */
    public toJSON(): any {
      const values = Object.assign({}, this.get());
      
      // Mapear la categoría a carpetaimg
      if (values.categoria) {
        values.carpetaimg = this.getCarpetaImg();
        // Asignar categoria_id para mantener compatibilidad con la interfaz
        values.categoria_id = values.categoria;
      }
      
      return values;
    }

    /**
     * Método para obtener el nombre de carpeta de imagen según la categoría
     */
    public getCarpetaImg(): string {
      const categoryMap: { [key: number]: string } = {
        1: 'anillo',
        2: 'barbell',
        3: 'tuneles',
        4: 'plug',
        5: 'expander',
        6: 'banana',
        7: 'labret',
        8: 'barbell',
        9: 'circular-barbel',
        10: 'anillo',
        11: 'piercing',
        12: 'dilataciones'
      };

      const categoria = this.get('categoria') as number;
      return categoryMap[categoria] || 'default';
    }
  }

  /**
   * Definir el modelo Product con sus atributos
   */
  const ProductModel = Product.init({
    id: {
      type: dataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    nombre: {
      type: dataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El nombre es requerido'
        },
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        }
      }
    },
    descripcion: {
      type: dataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: dataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El precio es requerido'
        },
        isDecimal: {
          msg: 'El precio debe ser un número decimal'
        },
        min: {
          args: [0],
          msg: 'El precio no puede ser negativo'
        }
      }
    },
    categoria_id: {
      type: dataTypes.INTEGER,
      field: 'categoria', // Campo real en la base de datos
      allowNull: false,
      validate: {
        notNull: {
          msg: 'La categoría es requerida'
        }
      }
    },
    imagen: {
      type: dataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'producto',
    timestamps: false,
    underscored: false,
    paranoid: false,
    freezeTableName: true,
  });

  /**
   * Definir asociaciones del modelo Product
   */
  (ProductModel as any).associate = (models: any) => {
    ProductModel.belongsTo(models.Category, {
      foreignKey: 'categoria',  // Campo real en la base de datos
      as: 'categoryInfo'        // Cambiado a 'categoryInfo' para evitar colisión
    });
  };

  return ProductModel;
}