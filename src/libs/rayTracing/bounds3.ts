import {vec3, type Vec3} from 'wgpu-matrix';

import {compare} from '../../utils';

type MaxExtent = 0 | 1 | 2;

const minNum = Number.MIN_SAFE_INTEGER;
const maxNum = Number.MAX_SAFE_INTEGER;

export class Bounds {
  pMin: Vec3 = [maxNum, maxNum, maxNum];
  pMax: Vec3 = [minNum, minNum, minNum];

  constructor();
  constructor(p1: Bounds, p2: Bounds);
  constructor(p1: Bounds, p2: Vec3);
  constructor(p1: Vec3, p2: Vec3);
  constructor(p1?: Vec3 | Bounds, p2?: Vec3 | Bounds) {
    if (isBounds(p1) && isBounds(p2)) {
      this.pMin = compare.min(p1.pMin, p2.pMin);
      this.pMax = compare.max(p1.pMax, p2.pMax);
    } else if (isVec3(p1) && isVec3(p2)) {
      this.pMin = compare.min(p1, p2);
      this.pMax = compare.max(p1, p2);
    } else if (isBounds(p1) && isVec3(p2)) {
      this.pMin = compare.min(p1.pMin, p2);
      this.pMax = compare.max(p1.pMax, p2);
    }
  }

  centroid() {
    return vec3.mulScalar(vec3.add(this.pMin, this.pMax), 0.5);
  }

  maxExtent(): MaxExtent {
    const diagonal = vec3.subtract(this.pMax, this.pMin);

    if (diagonal[0] > diagonal[1] && diagonal[0] > diagonal[2]) return 0;
    if (diagonal[1] > diagonal[2]) return 1;
    return 2;
  }
}

function isBounds(p: unknown): p is Bounds {
  return p instanceof Bounds;
}

function isVec3(p: unknown): p is Vec3 {
  return p instanceof Array || p instanceof Float32Array || p instanceof Float64Array;
}
