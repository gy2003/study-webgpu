import type {Sphere} from './sphere';
import {MaterialType} from './material';

export class HittableList {
  objects: Sphere[] = [];

  add(object: Sphere) {
    this.objects.push(object);
  }

  clear() {
    this.objects = [];
  }

  getObjectsBuffer(device: GPUDevice) {
    const objectsArray: number[] = [];
    const materialsArray: number[][] = [];

    this.objects.forEach((obj) => {
      const material = obj.material;

      if (materialsArray[material.type]) {
        materialsArray[material.type].push(...material.getMaterialData());
      } else {
        materialsArray[material.type] = [...material.getMaterialData()]
      }

      objectsArray.push(...obj.center, obj.radius, material.type);
    });
    const objectsArrayView = new Float32Array(objectsArray);

    const objectBuffer = device.createBuffer({
      label: 'objectBuffer',
      size: objectsArrayView.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    device.queue.writeBuffer(objectBuffer, 0, objectsArrayView, 0);

    return objectBuffer;
  }
}
