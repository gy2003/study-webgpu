type Center = [number, number, number];

export class Sphere {
  center: Center;
  radius: number;
  constructor(center: Center, radius: number) {
    this.center = center;
    this.radius = radius;
  }
}
