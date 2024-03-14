export enum MaterialType {
  Lambertian = 0,
  Metal,
  Dielectric,
}

export abstract class Material {
  public abstract type: MaterialType;
  public abstract getMaterialData(): number[];
}