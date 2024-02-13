import {getCanvasInfo} from '../../utils';
import type {CanvasInfo} from '../../utils';
import vertexShader from "./vertex.wgsl?raw";
import fragmentShader from "./fragment.wgsl?raw";
import computeShader from "./compute.wgsl?raw";

const GRID_SIZE = 32;
const UPDATE_INTERVAL = 200;
const WORKGROUP_SIZE = 8;

let step = 0;

export class Game {
  canvasInfo!: CanvasInfo;

  vertexBuffer!: GPUBuffer;
  vertexBufferLayout!: GPUVertexBufferLayout;

  uniformBuffer!: GPUBuffer;
  cellStateStorage!: GPUBuffer[];
  bindGroups!: GPUBindGroup[];
  bindGroupLayout!: GPUBindGroupLayout;

  pipelineLayout!: GPUPipelineLayout;
  computePipeline!: GPUComputePipeline;
  renderPipeline!: GPURenderPipeline;

  async initialize(canvas: HTMLCanvasElement) {
    this.canvasInfo = await getCanvasInfo(canvas);

    this.createVertexBuffer();
    this.createBindGroup();
    this.createPipelineLayout();
    this.createComputePipeline();
    this.createRenderPipeline();

    return Promise.resolve(this);
  }

  createVertexBuffer() {
    const device = this.canvasInfo.device;
    const vertices = new Float32Array([
      -0.8, -0.8,
       0.8, -0.8,
       0.8,  0.8,
      -0.8, -0.8,
       0.8,  0.8,
      -0.8,  0.8,
    ]);

    this.vertexBuffer = device.createBuffer({
      label: "Cell vertices",
      size: vertices.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices, 0, vertices.length);

    this.vertexBufferLayout = {
      arrayStride: 8,
      attributes: [
        {format: "float32x2", offset: 0, shaderLocation: 0},
      ],
    };
  }

  createBindGroup() {
    const device = this.canvasInfo.device;

    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    this.uniformBuffer = device.createBuffer({
      label: "Grids uniforms",
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    device.queue.writeBuffer(this.uniformBuffer, 0, uniformArray, 0, uniformArray.length);

    const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
    this.cellStateStorage = [
      device.createBuffer({
        label: "Cell State A",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
      }),
      device.createBuffer({
        label: "Cell State B",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
      }),
    ];

    for (let i = 0; i < cellStateArray.length; i++) {
      cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
    }
    device.queue.writeBuffer(this.cellStateStorage[0], 0, cellStateArray, 0, cellStateArray.length);

    for (let i = 0; i < cellStateArray.length; i++) {
      cellStateArray[i] = i % 2;
    }
    device.queue.writeBuffer(this.cellStateStorage[1], 0, cellStateArray, 0, cellStateArray.length);

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
        buffer: {}
      }, {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage"
        },
      }, {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage"
        },
      }]
    });
    this.bindGroups = [
      device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: this.bindGroupLayout,
        entries: [{
          binding: 0,
          resource: {buffer: this.uniformBuffer},
        }, {
          binding: 1,
          resource: {buffer: this.cellStateStorage[0]},
        }, {
          binding: 2,
          resource: {buffer: this.cellStateStorage[1]},
        }],
      }),
      device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: this.bindGroupLayout,
        entries: [{
          binding: 0,
          resource: {buffer: this.uniformBuffer},
        }, {
          binding: 1,
          resource: {buffer: this.cellStateStorage[1]},
        }, {
          binding: 2,
          resource: {buffer: this.cellStateStorage[0]},
        }],
      })
    ];
  }

  createPipelineLayout() {
    this.pipelineLayout = this.canvasInfo.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });
  }

  createComputePipeline() {
    const device = this.canvasInfo.device;

    this.computePipeline = device.createComputePipeline({
      label: "Simulation pipeline",
      layout: this.pipelineLayout,
      compute: {
        module: device.createShaderModule({code: computeShader}),
        entryPoint: "computeMain",
        constants: {
          "workgroupSize": WORKGROUP_SIZE,
        }
      }
    });
  }

  createRenderPipeline() {
    const {device, format} = this.canvasInfo;

    this.renderPipeline = device.createRenderPipeline({
      label: "Cell render pipeline",
      layout: this.pipelineLayout,
      vertex: {
        module: device.createShaderModule({code: vertexShader}),
        entryPoint: "vertexMain",
        buffers: [this.vertexBufferLayout],
      },
      fragment: {
        module: device.createShaderModule({code: fragmentShader}),
        entryPoint: "fragmentMain",
        targets: [{format}],
      }
    });
  }

  updateGrid() {
    const {device, context} = this.canvasInfo;
    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();

    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.bindGroups[step % 2]);

    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

    computePass.end();

    step++;

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0.4, 1],
        loadOp: "clear",
        storeOp: "store",
      }]
    });

    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroups[step % 2]);
    pass.draw(6, GRID_SIZE * GRID_SIZE);

    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  render() {
    setInterval(this.updateGrid.bind(this), UPDATE_INTERVAL);
  }
}
