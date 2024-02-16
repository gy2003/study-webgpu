struct Camera {
  cameraPos: vec3f,
  scale: f32,
  aspectRaio: f32,
}

struct Ray {
  origin: vec3f,
  direction: vec3f,

}

@group(0) @binding(0) var imageTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> camera: Camera;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let screenSize = textureDimensions(imageTexture);

  if (id.x >= u32(screenSize.x) || id.y >= u32(screenSize.y)) {
    return;
  }

  let x = (2.0 * (f32(id.x) + 0.5) / f32(screenSize.x) - 1.0) * camera.aspectRaio * camera.scale;
  let y = (1.0 - 2.0 * (f32(id.y) + 0.5) / f32(screenSize.y)) * camera.scale;
  let rayDir = normalize(vec3f(x, y, -1.0));
  let ray = genRay(camera.cameraPos, rayDir);

  let color = rayColor(ray);
  textureStore(imageTexture, vec2<i32>(id.xy), color);
}

fn genRay(origin: vec3f, direction: vec3f) -> Ray {
  var ray: Ray;
  ray.origin = origin;
  ray.direction = direction;
  return ray;
}

fn rayAt(ray: Ray, t: f32) -> vec3f {
  return ray.origin + t * ray.direction;
}

fn rayColor(ray: Ray) -> vec4f {
  let t = hit_sphere(vec3f(0.0, 0.0, -1.0), 0.5, ray);
  if (t > 0.0) {
    let N = normalize(rayAt(ray, t) - vec3f(0.0, 0.0, -1.0));
    let color = 0.5 * vec3f(N.x + 1.0, N.y + 1.0, N.z + 1.0);
    return vec4f(color, 1.0);
  }

  let a = 0.5 * (ray.direction.y + 1.0);
  let color = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
  return vec4f(color, 1.0);
}

fn hit_sphere(center: vec3f, radius: f32, ray: Ray) -> f32 {
  let oc = ray.origin - center;
  let a = dot(ray.direction, ray.direction);
  let half_b = dot(oc, ray.direction);
  let c = dot(oc, oc) - radius * radius;
  let discriminant = half_b * half_b - a * c;

  if (discriminant < 0.0) {
    return -1.0;
  } else {
    return (-half_b - sqrt(discriminant)) / a;
  }
}