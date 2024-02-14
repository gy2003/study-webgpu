import {getCanvasInfo} from '../../utils';
import type {CanvasInfo} from '../../utils';
import shader from "./shader.wgsl?raw";

let currentTime = new Date().getTime();
let step = 0;

export class Shader {
  canvasInfo!: CanvasInfo;

  time!: Float32Array;
  timeBuffer!: GPUBuffer;
  vertexBuffer!: GPUBuffer;
  bindGroup!: GPUBindGroup;
  pipeline!: GPURenderPipeline;

  async initialize(canvas: HTMLCanvasElement) {
    this.canvasInfo = await getCanvasInfo(canvas);

    const {device, format} = this.canvasInfo;

    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
    ]);
    this.vertexBuffer = device.createBuffer({
      label: "Vertices",
      size: vertices.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices, 0);

    const shaderModule = device.createShaderModule({code: shader});
    this.pipeline = device.createRenderPipeline({
      label: "Render pieline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: [{
          arrayStride: 8,
          attributes: [
            {format: "float32x2", offset: 0, shaderLocation: 0},
          ]
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{format}],
      }
    });

    const resolution = new Float32Array([canvas.width, canvas.height]);
    const resolutionBuffer = device.createBuffer({
      label: "resolutionBuffer",
      size: resolution.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    device.queue.writeBuffer(resolutionBuffer, 0, resolution, 0);

    this.time = new Float32Array([0]);
    this.timeBuffer = device.createBuffer({
      label: "timeBuffer",
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    device.queue.writeBuffer(this.timeBuffer, 0, this.time, 0);

    this.bindGroup = device.createBindGroup({
      label: "bindGroup",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: resolutionBuffer}},
        {binding: 1, resource: {buffer: this.timeBuffer}},
      ],
    });

    return Promise.resolve(this);
  }

  render() {
    const {device, context} = this.canvasInfo;

    if (new Date().getTime() - currentTime > 16) {
      step += 0.05;
      this.time[0] = step;
      device.queue.writeBuffer(this.timeBuffer, 0, this.time, 0);
      currentTime = new Date().getTime();
    }

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0, 1],
        loadOp: "clear",
        storeOp: "store",
      }],
    });

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6, 1);
    pass.end();

    device.queue.submit([encoder.finish()]);
    
    requestAnimationFrame(this.render.bind(this));
  }
}