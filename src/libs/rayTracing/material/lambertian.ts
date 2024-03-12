import {MaterialType, Material} from './material';

type Color = [number, number, number];

export class Lambertian extends Material {
  public type = MaterialType.Lambertian;
  private albedo: Color;

  constructor(albedo: Color) {
    super();

    this.albedo = albedo;
  }

  public getMaterialData(): number[] {
    return [...this.albedo, 0];
  }
}
