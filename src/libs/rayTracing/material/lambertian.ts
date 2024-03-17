import type {Vec3} from 'wgpu-matrix';

import {MaterialType, Material} from './material';
export class Lambertian extends Material {
  public type = MaterialType.Lambertian;
  private albedo: Vec3;

  constructor(albedo: Vec3) {
    super();

    this.albedo = albedo;
  }

  public getMaterialData(): number[] {
    return [...this.albedo, 0];
  }
}
