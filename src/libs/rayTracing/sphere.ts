import type {Vec3} from 'wgpu-matrix';

import type {Material} from "./material";
export class Sphere {
  center: Vec3;
  radius: number;
  material: Material;
  constructor(center: Vec3, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;
  }
}
