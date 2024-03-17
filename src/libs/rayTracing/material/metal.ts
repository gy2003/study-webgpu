import type {Vec3} from 'wgpu-matrix';

import {MaterialType, Material} from './material';

export class Metal extends Material {
  public type = MaterialType.Metal;
  private albedo: Vec3;
  private fuzz: number;

  constructor(albedo: Vec3, fuzz: number) {
    super();

    this.albedo = albedo;
    this.fuzz = fuzz;
  }

  public getMaterialData(): number[] {
    return [...this.albedo, this.fuzz];
  }
}