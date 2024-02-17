const WorldLength = 2;
const Infinity: f32 = 0x1p+127f; // https://www.w3.org/TR/WGSL/#f32

struct Camera {
  cameraPos: vec3f,
  scale: f32,
  aspectRaio: f32,
}

struct Ray {
  origin: vec3f,
  direction: vec3f,
}

struct HitRecord {
  p: vec3f,
  normal: vec3f,
  t: f32,
  frontFace: bool,
}

struct Sphere {
  center: vec3f,
  radius: f32,
}

@group(0) @binding(0) var imageTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<storage> world: array<Sphere, WorldLength>;

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

fn setFaceNormal(r: Ray, outwardNormal: vec3f, rec: ptr<function, HitRecord>) {
  (*rec).frontFace = dot(r.direction, outwardNormal) < 0.0;

  if ((*rec).frontFace) {
    (*rec).normal = outwardNormal;
  } else {
    (*rec).normal = -outwardNormal;
  }
}

fn rayAt(ray: Ray, t: f32) -> vec3f {
  return ray.origin + t * ray.direction;
}

fn rayColor(ray: Ray) -> vec4f {
  var rec: HitRecord;
  if (hittableList(ray, 0.0, Infinity, &rec)) {
    let color = 0.5 * (rec.normal + vec3f(1.0, 1.0, 1.0));;
    return vec4f(color, 1.0);
  }

  let a = 0.5 * (ray.direction.y + 1.0);
  let color = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
  return vec4f(color, 1.0);
}

fn sphere_hit(r: Ray, ray_tmin: f32, ray_tmax: f32, rec: ptr<function, HitRecord>, sphere: Sphere) -> bool {
  let oc = r.origin - sphere.center;
  let a = dot(r.direction, r.direction);
  let half_b = dot(oc, r.direction);
  let c = dot(oc, oc) - sphere.radius * sphere.radius;

  let discriminant = half_b * half_b - a * c;
  if (discriminant < 0.0) {
    return false;
  }
  let sqrtd = sqrt(discriminant);

  var root = (-half_b - sqrtd) / a;
  if (root <= ray_tmin || root >= ray_tmax) {
    root = (-half_b + sqrtd) / a;
    if (root <= ray_tmin || root >= ray_tmax) {
      return false;
    }
  }

  (*rec).t = root;
  (*rec).p = rayAt(r, root);
  let outwardNormal = ((*rec).p - sphere.center) / sphere.radius;
  setFaceNormal(r, outwardNormal, rec);

  return true;
}

fn hittableList(r: Ray, rayTmin: f32, rayTmax: f32, rec: ptr<function, HitRecord>) -> bool {
  var tempRec: HitRecord;
  var hitAnything = false;
  var closestSoFar = rayTmax;

  for (var i: i32 = 0; i < WorldLength; i++) {
    var object = world[i];
    if (sphere_hit(r, rayTmin, closestSoFar, &tempRec, object)) {
      hitAnything = true;
      closestSoFar = tempRec.t;
      *rec = tempRec;
    }
  }

  return hitAnything;
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

// https://godotshaders.com/snippet/random-value/
fn random(uv: vec2f) -> f32 {
  return fract(sin(dot(uv, vec2f(12.9898,78.233))) * 43758.5453123);
}