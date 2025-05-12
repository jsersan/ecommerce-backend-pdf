// src/interfaces/product.interface.ts
export interface IProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id?: number;
  categoria?: number;
  imagen: string;
  carpetaimg?: string;
  // Añadir esta propiedad para resolver el error:
  imagePath?: string;
  // Otras propiedades que pueda tener tu modelo
}