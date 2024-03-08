import type {Material} from "./material/lambertian";

type Center = [number, number, number];

export class Sphere {
  center: Center;
  radius: number;
  material: Material;
  constructor(center: Center, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;
  }
}
