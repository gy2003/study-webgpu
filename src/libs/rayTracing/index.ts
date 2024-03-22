import {getCanvasInfo} from '../../utils';
import type {CanvasInfo} from '../../utils';
import {Camera} from './camera';
import {HittableList} from './hittable';
import {generateWorld} from './generateWorld';
import computeShader from './shader/compute.wgsl?raw';
import renderShader from './shader/render.wgsl?raw';

const WORKGROUP_SIZE = 8;

class RayTracing {
  canvasInfo!: CanvasInfo;

  vertexBuffer!: GPUBuffer;
  vertexBufferLayout!: GPUVertexBufferLayout;

  // buffer
  cameraBuffer!: GPUBuffer;

  imageTexture!: GPUTexture;
  sampler!: GPUSampler;

  renderBindGroup!: GPUBindGroup;
  renderBindGroupLayout!: GPUBindGroupLayout;

  computeBindGroup!: GPUBindGroup;
  computeBindGroupLayout!: GPUBindGroupLayout;

  textureForMultisampling!: GPUTexture;
  textureForMultisamplingView!: GPUTextureView;

  computePipeline!: GPUComputePipeline;
  renderPipeline!: GPURenderPipeline;

  async initialize(canvas: HTMLCanvasElement) {
    this.canvasInfo = await getCanvasInfo(canvas);

    this.createVertexBuffer();
    this.createBuffer();

    this.createComputeBindGroup();
    this.createComputePipeline();

    this.createRenderBindGroup();
    this.createRenderPipeline();

    return Promise.resolve(this);
  }

  createVertexBuffer() {
    const device = this.canvasInfo.device;
    const vertices = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]);

    this.vertexBuffer = device.createBuffer({
      label: 'vertexBuffer',
      size: vertices.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices, 0);

    this.vertexBufferLayout = {
      arrayStride: 8,
      attributes: [{shaderLocation: 0, offset: 0, format: 'float32x2'}],
    };
  }

  createBuffer() {
    const {device, canvas} = this.canvasInfo;
    const camera = new Camera(
      [13, 2, 3],
      [0, 0, 0],
      [0, 1, 0],
      20,
      canvas.width,
      canvas.height,
      0.6,
      10
    );

    const cameraArray = new Float32Array([
      ...camera.cameraCenter,
      0,
      ...camera.pixel00Loc,
      0,
      ...camera.pixelDeltaU,
      0,
      ...camera.pixelDeltaV,
      camera.defocusAngle,
      ...camera.defocusDiskU,
      0,
      ...camera.defocusDiskV,
    ]);

    this.cameraBuffer = device.createBuffer({
      label: 'cameraBuffer',
      size: 96, // https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    device.queue.writeBuffer(this.cameraBuffer, 0, cameraArray, 0);

    this.imageTexture = device.createTexture({
      label: 'imageTexture',
      size: {
        width: canvas.width,
        height: canvas.height,
      },
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING,
    });
    this.sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
    });
  }

  createComputeBindGroup() {
    const {device} = this.canvasInfo;

    const world = new HittableList();
    generateWorld(world);

    const worldBuffer = world.getObjectsBuffer(device);

    this.computeBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            format: this.imageTexture.format,
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'read-only-storage',
          },
        },
      ],
    });

    this.computeBindGroup = device.createBindGroup({
      label: 'bindGroup',
      layout: this.computeBindGroupLayout,
      entries: [
        {binding: 0, resource: this.imageTexture.createView()},
        {binding: 1, resource: {buffer: this.cameraBuffer}},
        {binding: 2, resource: {buffer: worldBuffer.objectBuffer}},
        {binding: 3, resource: {buffer: worldBuffer.materialsBuffer[0]}},
        {binding: 4, resource: {buffer: worldBuffer.materialsBuffer[1]}},
        {binding: 5, resource: {buffer: worldBuffer.materialsBuffer[2]}},
      ],
    });
  }

  createRenderBindGroup() {
    const {device} = this.canvasInfo;

    this.renderBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
      ],
    });
    this.renderBindGroup = device.createBindGroup({
      label: 'bindGroup',
      layout: this.renderBindGroupLayout,
      entries: [
        {binding: 0, resource: this.imageTexture.createView()},
        {binding: 1, resource: this.sampler},
      ],
    });
  }

  createComputePipeline() {
    const device = this.canvasInfo.device;

    const pipelineLayout = this.canvasInfo.device.createPipelineLayout({
      bindGroupLayouts: [this.computeBindGroupLayout],
    });
    this.computePipeline = device.createComputePipeline({
      label: 'computePipeline',
      layout: pipelineLayout,
      compute: {
        module: device.createShaderModule({code: computeShader}),
        entryPoint: 'main',
      },
    });
  }

  createRenderPipeline() {
    const {device, format, canvas} = this.canvasInfo;

    const renderModule = device.createShaderModule({code: renderShader});

    const pipelineLayout = this.canvasInfo.device.createPipelineLayout({
      bindGroupLayouts: [this.renderBindGroupLayout],
    });
    this.renderPipeline = device.createRenderPipeline({
      label: 'renderPipeline',
      layout: pipelineLayout,
      vertex: {
        module: renderModule,
        entryPoint: 'vertexMain',
        buffers: [this.vertexBufferLayout],
      },
      fragment: {
        module: renderModule,
        entryPoint: 'fragmentMain',
        targets: [{format}],
      },
      multisample: {
        count: 4,
      },
    });

    this.textureForMultisampling = device.createTexture({
      label: 'textureForMultisampling',
      size: {
        width: canvas.width,
        height: canvas.height,
      },
      sampleCount: 4,
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.textureForMultisamplingView = this.textureForMultisampling.createView();
  }

  render() {
    console.time('renderTime');

    const {device, context, canvas} = this.canvasInfo;
    const enconder = device.createCommandEncoder();

    const computePass = enconder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup);

    const invocationCountX = Math.ceil(canvas.width / WORKGROUP_SIZE);
    const invocationCountY = Math.ceil(canvas.height / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(invocationCountX, invocationCountY, 1);
    computePass.end();

    const renderPass = enconder.beginRenderPass({
      colorAttachments: [
        {
          view: this.textureForMultisamplingView,
          resolveTarget: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    renderPass.setPipeline(this.renderPipeline);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.draw(6, 1);
    renderPass.end();

    device.queue.submit([enconder.finish()]);
    device.queue.onSubmittedWorkDone().then(() => {
      console.timeEnd('renderTime');
    });

  }
}

export async function main(canvas: HTMLCanvasElement) {
  new RayTracing().initialize(canvas).then((self) => {
    self.render();
  });
}
