import {MaterialType, Material} from './material';

type Color = [number, number, number];

export class Metal extends Material {
  public type = MaterialType.Metal;
  private albedo: Color;
  private fuzz: number;

  constructor(albedo: Color, fuzz: number) {
    super();

    this.albedo = albedo;
    this.fuzz = fuzz;
  }

  public getMaterialData(): number[] {
    return [...this.albedo, this.fuzz];
  }
}