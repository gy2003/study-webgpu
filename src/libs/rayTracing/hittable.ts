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
      const materialData = material.getMaterialData();

      if (materialsArray[material.type]) {
        materialsArray[material.type].push(...materialData);
      } else {
        materialsArray[material.type] = [...materialData];
      }

      const index = materialsArray[material.type].length / materialData.length - 1;

      objectsArray.push(
        ...obj.center0,
        obj.radius,
        ...obj.centerVec,
        material.type,
        index,
        obj.isMoving,
        0,
        0,
      );
    });
    const objectsArrayView = new Float32Array(objectsArray);
    const materialsBuffer: GPUBuffer[] = [];

    const objectBuffer = device.createBuffer({
      label: 'objectBuffer',
      size: objectsArrayView.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    device.queue.writeBuffer(objectBuffer, 0, objectsArrayView, 0);

    for (const i in MaterialType) {
      if (!isNaN(parseInt(i))) {
        // 没有material需要用数据填充, 不然会报错
        const materialArrayView = new Float32Array(
          materialsArray[parseInt(i)] || new Array(10).fill(0)
        );
        const buffer = device.createBuffer({
          label: 'material buffer',
          size: materialArrayView.byteLength,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
        });
        device.queue.writeBuffer(buffer, 0, materialArrayView, 0);
        materialsBuffer.push(buffer);
      }
    }

    return {objectBuffer, materialsBuffer};
  }
}
