import type {Vec3} from 'wgpu-matrix';

function min(p1: number, p2: number): number;
function min(p1: Vec3, p2: Vec3): Vec3;
function min(p1: number | Vec3, p2: number | Vec3): number | Vec3 {
  if (typeof p1 === 'number' && typeof p2 === 'number') return Math.min(p1, p2);

  if (typeof p1 === 'object' && typeof p2 === 'object') {
    return [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.min(p1[2], p2[2])];
  }

  return [];
}

function max(p1: number, p2: number): number;
function max(p1: Vec3, p2: Vec3): Vec3;
function max(p1: number | Vec3, p2: number | Vec3): number | Vec3 {
  if (typeof p1 === 'number' && typeof p2 === 'number') return Math.max(p1, p2);

  if (typeof p1 === 'object' && typeof p2 === 'object') {
    return [Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1]), Math.max(p1[2], p2[2])];
  }

  return [];
}

export const compare = {min, max};
