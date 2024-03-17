import type {Vec3} from 'wgpu-matrix';

export function random(): number;
export function random(min: number, max: number): number;
export function random(min?: number, max?: number) {
  if (typeof min === 'number' && typeof max === 'number') {
    return min + (max - min) * Math.random();
  }

  return Math.random();
}


export function randomVec3(): Vec3;
export function randomVec3(min: number, max: number): Vec3;
export function randomVec3(min?: number, max?: number) {
  if (typeof min === 'number' && typeof max === 'number') {
    return [random(min, max), random(min, max), random(min, max)];
  }

  return [random(), random(), random()];
}