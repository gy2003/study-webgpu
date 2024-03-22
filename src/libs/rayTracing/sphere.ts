import {vec3} from 'wgpu-matrix';
import type {Vec3} from 'wgpu-matrix';

import type {Material} from "./material";
import {Bounds} from './bounds3';
export class Sphere {
  center0: Vec3;
  radius: number;
  material: Material;
  centerVec: Vec3 = [0, 0, 0];
  isMoving = 0;
  bbox: Bounds;

  constructor(center1: Vec3, radius: number, material: Material, center2?: Vec3) {
    this.center0 = center1;
    this.radius = radius;
    this.material = material;
    
    if (center2) {
      // Moving
      this.isMoving = 1;
      this.centerVec = vec3.subtract(center2, center1);

      const rvec = [radius, radius, radius];
      const box1 = new Bounds(vec3.subtract(center1, rvec), vec3.add(center1, rvec));
      const box2 = new Bounds(vec3.subtract(center2, rvec), vec3.add(center2, rvec));
      this.bbox = new Bounds(box1, box2);
    } else {
      const rvec = [radius, radius, radius];
      this.bbox = new Bounds(vec3.subtract(center1, rvec), vec3.add(center1, rvec));
    }
  }
}
