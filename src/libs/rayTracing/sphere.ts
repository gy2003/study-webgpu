import type {Vec3} from 'wgpu-matrix';

import type {Material} from "./material";
export class Sphere {
  center0: Vec3;
  radius: number;
  material: Material;
  centerVec: Vec3 = [0, 0, 0];
  isMoving = 0;

  constructor(center: Vec3, radius: number, material: Material, centerVec?: Vec3) {
    this.center0 = center;
    this.radius = radius;
    this.material = material;
    
    if (centerVec) {
      this.isMoving = 1;
      this.centerVec = centerVec;
    }
  }
}
