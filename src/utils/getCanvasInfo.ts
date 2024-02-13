export interface CanvasInfo {
  canvas: HTMLCanvasElement;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
}

export async function getCanvasInfo(canvas: HTMLCanvasElement): Promise<CanvasInfo> {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();

  if (!adapter || !device) {
    throw new Error('Need a browser that supports webgpu.');
  }

  const context = canvas.getContext('webgpu');

  if (!context) throw new Error('Losing the canvas context.');

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
  });

  return {
    canvas,
    device,
    context,
    format,
  };
}
