type Color = [number, number, number];

export class Lambertian {
  constructor(public albedo: Color) {}
}

export type Material = Lambertian;