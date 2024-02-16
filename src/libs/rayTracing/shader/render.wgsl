struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertexMain(@location(0) pos: vec2f) -> VertexOutput {
  var uv = vec2f(pos.x, -pos.y);
  uv = (uv + 1.0) / 2.0;

  var output: VertexOutput;
  output.position = vec4f(pos, 0.0, 1.0);
  output.uv = uv;
  return output;
}

@group(0) @binding(0) var ourTexture: texture_2d<f32>;
@group(0) @binding(1) var ourSampler: sampler;

@fragment
fn fragmentMain(@location(0) uv: vec2f) -> @location(0) vec4f {
  return textureSample(ourTexture, ourSampler, uv);
}