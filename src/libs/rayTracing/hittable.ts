import type {Sphere} from "./sphere";

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
    this.objects.forEach(obj => {
      objectsArray.push(...obj.center, obj.radius);
    });
    const objectsArrayView = new Float32Array(objectsArray);

    const objectBuffer = device.createBuffer({
      label: "objectBuffer",
      size: objectsArrayView.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    device.queue.writeBuffer(objectBuffer, 0, objectsArrayView, 0);

    return objectBuffer;
  }
}