import {vec3} from 'wgpu-matrix';

import {Lambertian, Metal, Dielectric, type Material} from './material';
import {Sphere} from './sphere';
import {random, randomVec3} from '../../utils';
import type {HittableList} from './hittable';

export function generateWorld(world: HittableList) {
  const groundMaterial = new Lambertian([0.5, 0.5, 0.5]);
  world.add(new Sphere([0, -1000, 0], 1000, groundMaterial));

  for (let i = -11; i < 11; i++) {
    for (let j = -11; j < 11; j++) {
      const chooseMat = random();
      const center = [i + 0.9 * random(), 0.2, j + 0.9 * random()];

      if (vec3.length(vec3.subtract(center, [4, 0.2, 0])) > 0.9) {
        let sphereMaterial: Material;

        if (chooseMat < 0.8) {
          // diffuse
          const albedo = vec3.mul(randomVec3(), randomVec3());
          sphereMaterial = new Lambertian(albedo);
          const center2 = vec3.add(center, [0, random(0, 0.5), 0]);
          world.add(new Sphere(center, 0.2, sphereMaterial, center2));
        } else if (chooseMat < 0.95) {
          // metal
          const albedo = randomVec3(0.5, 1);
          const fuzz = random(0, 0.5);
          sphereMaterial = new Metal(albedo, fuzz);
          world.add(new Sphere(center, 0.2, sphereMaterial));
        } else {
          // glass
          sphereMaterial = new Dielectric(1.5);
          world.add(new Sphere(center, 0.2, sphereMaterial));
        }
      }
    }
  }

  const material1 = new Dielectric(1.5);
  world.add(new Sphere([0, 1, 0], 1, material1));

  const material2 = new Lambertian([0.4, 0.2, 0.1]);
  world.add(new Sphere([-4, 1, 0], 1, material2));

  const material3 = new Metal([0.7, 0.6, 0.5], 0.0);
  world.add(new Sphere([4, 1, 0], 1, material3));
}
