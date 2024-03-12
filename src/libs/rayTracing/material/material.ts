export enum MaterialType {
  Lambertian = 0,
}

export abstract class Material {
  public abstract type: MaterialType;
  public abstract getMaterialData(): number[];
}