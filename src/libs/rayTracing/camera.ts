import {vec3, type Vec3} from 'wgpu-matrix';
export class Camera {
  cameraCenter: Vec3;
  pixel00Loc!: Vec3;
  pixelDeltaU!: Vec3;
  pixelDeltaV!: Vec3;
  defocusDiskU!: Vec3;
  defocusDiskV!: Vec3;
  defocusAngle: number;

  private u!: Vec3;
  private v!: Vec3;
  private w!: Vec3;

  constructor(
    lookfrom: Vec3,
    lookat: Vec3,
    up: Vec3,
    fov: number,
    imageWidth: number,
    imageHeight: number,
    defocusAngle = 0,
    focusDist = 10
  ) {
    this.cameraCenter = lookfrom;
    this.defocusAngle = defocusAngle;

    this.calculateCameraBasisVectors(lookfrom, lookat, up);
    this.calculateLocationOfUpperLeftPixel(fov, imageWidth, imageHeight, focusDist);
  }

  private calculateCameraBasisVectors(lookfrom: Vec3, lookat: Vec3, up: Vec3) {
    this.w = vec3.normalize(vec3.subtract(lookfrom, lookat));
    this.u = vec3.normalize(vec3.cross(up, this.w));
    this.v = vec3.cross(this.w, this.u);
  }

  private calculateLocationOfUpperLeftPixel(
    fov: number,
    imageWidth: number,
    imageHeight: number,
    focusDist: number
  ) {
    const h = Math.tan((Math.PI * fov * 0.5) / 180);
    const viewportHeight = 2 * h * focusDist;
    const viewportWidth = (viewportHeight * imageWidth) / imageHeight;

    const viewportU = vec3.mulScalar(this.u, viewportWidth);
    const viewportV = vec3.mulScalar(this.v, -viewportHeight);

    this.pixelDeltaU = vec3.divScalar(viewportU, imageWidth);
    this.pixelDeltaV = vec3.divScalar(viewportV, imageHeight);

    // 相对于相机的坐标 camera space
    const halfViewportU = vec3.mulScalar(viewportU, -0.5);
    const halfViewportV = vec3.mulScalar(viewportV, -0.5);
    const upperLeft = vec3.add(halfViewportU, halfViewportV);
    const cameraW = vec3.mulScalar(this.w, -focusDist);
    const cameraUpperLeft = vec3.add(cameraW, upperLeft);

    // world space
    const viewportUpperLeft = vec3.add(this.cameraCenter, cameraUpperLeft);
    this.pixel00Loc = vec3.add(
      viewportUpperLeft,
      vec3.mulScalar(vec3.add(this.pixelDeltaU, this.pixelDeltaV), 0.5)
    );

    const defocusRadius = focusDist * Math.tan((Math.PI * this.defocusAngle * 0.5) / 180);
    this.defocusDiskU = vec3.mulScalar(this.u, defocusRadius);
    this.defocusDiskV = vec3.mulScalar(this.v, defocusRadius);
  }
}
