struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

struct Resolution {
  x: f32,
  y: f32,
}

@group(0) @binding(0) var<uniform> resolution: Resolution;
@group(0) @binding(1) var<uniform> time: f32;

@vertex
fn vertexMain(@location(0) position: vec2f) -> VertexOutput {
  var output: VertexOutput;
  var uv = position;
  uv.x *= resolution.x / resolution.y;
  output.pos = vec4f(position, 0.0, 1.0);
  output.uv = uv;
  return output;
}

fn palette(t: f32) -> vec3f {
  var a = vec3f(0.5, 0.5, 0.5);
  var b = vec3f(0.5, 0.5, 0.5);
  var c = vec3f(1.0, 1.0, 1.0);
  var d = vec3f(0.263, 0.416, 0.557);

  return a + b * cos(6.28318 * (c * t + d));
}

@fragment
fn fragmentMain(@location(0) _uv: vec2f) -> @location(0) vec4f {
  let uv0 = _uv;
  var uv = _uv;
  var finalColor = vec3f(0.0);
  
  for (var i: f32 = 0.0; i < 4.0; i += 1.0) {
    uv = fract(uv * 1.5) - 0.5;

    var d = length(uv) * exp(-length(uv0));
    var col = palette(length(uv0) + i * 0.4 + time * 0.4);

    d = sin(d * 8.0 + time) / 8.0;
    d = abs(d);

    d = pow(0.01 / d, 1.2);

    finalColor += col * d;
  }

  return vec4f(finalColor, 1.0);
}