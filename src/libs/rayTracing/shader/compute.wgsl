const Infinity: f32 = 0x1p+127f; // https://www.w3.org/TR/WGSL/#f32
const SamplesPerPixel = 60.f;
const PI = 3.1415926535;

struct Camera {
  cameraCenter: vec3f,
  pixel00Loc: vec3f,
  pixelDeltaU: vec3f,
  pixelDeltaV: vec3f,
  defocusAngle: f32,
  defocusDiskU: vec3f,
  defocusDiskV: vec3f,
}

struct Ray {
  origin: vec3f,
  direction: vec3f,
  time: f32,
}

struct HitRecord {
  p: vec3f,
  normal: vec3f,
  t: f32,
  frontFace: bool,
  materialType: f32,
  materialIndex: f32,
}

struct Sphere {
  center: vec3f,
  radius: f32,
  centerVec: vec3f,
  materialType: f32,
  pMin: vec3f,
  leftIndex: f32,
  pMax: vec3f,
  rightIndex: f32,
  parentIndex: f32,
  materialIndex: f32,
  isMoving: f32,
  isObject: f32,
}

struct Lambertian {
  albedo: vec3f,
}

struct Metal {
  albedo: vec3f,
  fuzz: f32,
}

struct Dieletric {
  ir: f32,
}

struct Interval {
  min: f32,
  max: f32,
}

@group(0) @binding(0) var imageTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<storage> world: array<Sphere>;
@group(0) @binding(3) var<storage, read> lambertian: array<Lambertian>;
@group(0) @binding(4) var<storage, read> metal: array<Metal>;
@group(0) @binding(5) var<storage, read> dieletric: array<Dieletric>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) _id: vec3u) {
  let screenSize = textureDimensions(imageTexture);

  if (_id.x >= u32(screenSize.x) || _id.y >= u32(screenSize.y)) {
    return;
  }

  var pixelColor = vec3f(0.0, 0.0, 0.0);
  for (var i: f32 = 0.0; i < SamplesPerPixel; i += 1.0) {
    var rx = rand(vec2f(f32(_id.x) + i, f32(_id.y) + i));
    var ry = rand(vec2f(f32(_id.y) + i, f32(_id.x) + i));
    var id = vec2f(f32(_id.x) + rx, f32(_id.y) + ry);

    let pixelCenter = camera.pixel00Loc + (id.x * camera.pixelDeltaU) + (id.y * camera.pixelDeltaV);

    let rayOrign = select(defocusDiskSample(pixelCenter, camera.cameraCenter), camera.cameraCenter, camera.defocusAngle <= 0.0f);
    let rayDir = normalize(pixelCenter - rayOrign);
    let rayTime = rand(pixelCenter.xy);
    let ray = genRay(rayOrign, rayDir, rayTime);
    pixelColor += rayColor(ray);
  }

  pixelColor = sqrt(pixelColor / SamplesPerPixel);
  textureStore(imageTexture, vec2<i32>(_id.xy), vec4f(pixelColor, 1.0));
}

fn genRay(origin: vec3f, direction: vec3f, time: f32) -> Ray {
  var ray: Ray;
  ray.origin = origin;
  ray.direction = direction;
  ray.time = time;
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

fn rayColor(_ray: Ray) -> vec3f {
  var depth = 50;
  var ray = _ray;
  var factor = vec3f(1.0, 1.0, 1.0);
  var resultColor: vec3f;

  loop {
    if (depth <= 0) {
      resultColor = vec3f(0.0, 0.0, 0.0);
      break;
    }
    depth--;

    var rec: HitRecord;
    var interval = genInterval(0.001, Infinity);
    if (hittableList(ray, &interval, &rec)) {
      /**
       * Lambertian distribution
       * https://en.wikipedia.org/wiki/Lambertian_reflectance
       * 让反射光线向法线靠近
      */
      var scattered: Ray;
      var attenuation: vec3f;

      // Lambertian
      if (rec.materialType == 0.f) {
        if (lambertianScatter(ray, rec, &attenuation, &scattered, lambertian[i32(rec.materialIndex)])) {
          ray = scattered;
          factor = attenuation * factor;
          continue;
        }

        resultColor = vec3f(0.0, 0.0, 0.0);
        break; 
      }

      // Metal
      if (rec.materialType == 1.f) {
        if (metalScatter(ray, rec, &attenuation, &scattered, metal[i32(rec.materialIndex)])) {
          ray = scattered;
          factor = attenuation * factor;
          continue;
        }

        resultColor = vec3f(0.0, 0.0, 0.0);
        break;
      }

      // dieletric
      if (rec.materialType == 2.f) {
        if (dieletricScatter(ray, rec, &attenuation, &scattered, dieletric[i32(rec.materialIndex)])) {
          ray = scattered;
          factor = attenuation * factor;
          continue;
        }

        resultColor = vec3f(0.0, 0.0, 0.0);
        break;
      }
    }

    let a = 0.5 * (ray.direction.y + 1.0);
    resultColor = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
    break;
  }

  resultColor = resultColor * factor;
  return resultColor;
}

fn sphere_hit(r: Ray, ray_t: Interval, rec: ptr<function, HitRecord>, sphere: Sphere) -> bool {
  let center = select(sphere.center, sphere.center + r.time * sphere.centerVec, sphere.isMoving == 1.0f);
  let oc = r.origin - center;
  let a = dot(r.direction, r.direction);
  let half_b = dot(oc, r.direction);
  let c = dot(oc, oc) - sphere.radius * sphere.radius;

  let discriminant = half_b * half_b - a * c;
  if (discriminant < 0.0) {
    return false;
  }
  let sqrtd = sqrt(discriminant);

  var root = (-half_b - sqrtd) / a;
  if (!intervalSurrounds(ray_t, root)) {
    root = (-half_b + sqrtd) / a;
    if (!intervalSurrounds(ray_t, root)) {
      return false;
    }
  }

  (*rec).t = root;
  (*rec).p = rayAt(r, root);
  (*rec).materialType = sphere.materialType;
  (*rec).materialIndex = sphere.materialIndex;
  let outwardNormal = ((*rec).p - sphere.center) / sphere.radius;
  setFaceNormal(r, outwardNormal, rec);

  return true;
}

// 判断是否与bounds相交
fn aabbHit(r: Ray, ray_t: Interval, sphere: Sphere) -> bool {
  var tempRec = ray_t;
  let invDir = 1.f / r.direction;
  var pIn = (sphere.pMin - r.origin) * invDir;
  var pOut = (sphere.pMax - r.origin) * invDir;

  if (invDir.x < 0.f) {
    swap(&pIn, &pOut, 0);
  }

  if (invDir.y < 0.f) {
    swap(&pIn, &pOut, 1);
  }

  if (invDir.z < 0.f) {
    swap(&pIn, &pOut, 2);
  }

  let tmin = max(pIn.x, max(pIn.y, pIn.z));
  let tmax = min(pOut.x, min(pOut.y, pOut.z));

  return tmax > 0f && tmin <= tmax;
}

fn hittableList(r: Ray, ray_t: ptr<function, Interval>, rec: ptr<function, HitRecord>) -> bool {
  var hitAnything = false;
  var stack = makeSphereStack();

  push(&stack, world[0]);

  while(!stackIsEmpty(stack)) {
    let object = pop(&stack);

    if (object.isObject == 0.0) {
      if (aabbHit(r, genInterval((*ray_t).min, (*ray_t).max), object)) {
        if (object.rightIndex >= 0.0) {
          push(&stack, world[i32(object.rightIndex)]);
        }

        if (object.leftIndex >= 0.0) {
          push(&stack, world[i32(object.leftIndex)]);
        }
      }

      continue;
    }

    if (object.isObject == 1.0 && sphere_hit(r, genInterval((*ray_t).min, (*ray_t).max), rec, object)) {
      hitAnything = true;
      (*ray_t).max = (*rec).t;
    }
  }

  return hitAnything;
}

fn lambertianScatter(ray: Ray, rec: HitRecord, attenuation: ptr<function, vec3f>, scattered: ptr<function, Ray>, material: Lambertian) -> bool {
  var scatterDirection = rec.normal + normalize(randomInUnitSphere(rec.p));

  if (near_zero(scatterDirection)) {
    scatterDirection = rec.normal;
  }

  *scattered = genRay(rec.p, scatterDirection, ray.time);
  *attenuation = material.albedo;
  return true;
}

fn metalScatter(ray: Ray, rec: HitRecord, attenuation: ptr<function, vec3f>, scattered: ptr<function, Ray>, material: Metal) -> bool {
  let reflected = reflect(normalize(ray.direction), rec.normal);

  *scattered = genRay(rec.p, reflected + material.fuzz * normalize(randomInUnitSphere(rec.p)), ray.time);
  *attenuation = material.albedo;
  return dot((*scattered).direction, rec.normal) > 0.f;
}

fn reflectance(cosine: f32, refIdx: f32) -> f32 {
  // Schlick's approximation
  var r0 = (1.0f - refIdx) / (1.0f + refIdx);
  r0 = r0 * r0;
  return r0 + (1.0f - r0) * pow((1.0f - cosine), 5.0f);
}

fn dieletricScatter(ray: Ray, rec: HitRecord, attenuation: ptr<function, vec3f>, scattered: ptr<function, Ray>, material: Dieletric) -> bool {
  (*attenuation) = vec3f(1.0, 1.0, 1.0);
  let refractionRatio = select(material.ir, 1.0 / material.ir, rec.frontFace);

  let unitDirection = normalize(ray.direction);
  let cosTheta = min(dot(-unitDirection, rec.normal), 1.0f);
  let sinTheta = sqrt(1.0f - cosTheta * cosTheta);

  let cannotRefract = refractionRatio * sinTheta > 1.0f;
  var direction: vec3f;

  if (cannotRefract || reflectance(cosTheta, refractionRatio) > rand(rec.p.xy)) {
    direction = reflect(unitDirection, rec.normal);
  } else {
    direction = refract(unitDirection, rec.normal, refractionRatio);
  }

  *scattered = genRay(rec.p, direction, ray.time);
  return true;
}

fn genInterval(min: f32, max: f32) -> Interval {
  var interval: Interval;
  interval.min = min;
  interval.max = max;
  return interval;
}

fn intervalContains(interval: Interval, x: f32) -> bool {
  return interval.min <= x && x <= interval.max;
}

fn intervalSurrounds(interval: Interval, x: f32) -> bool {
  return interval.min < x && x < interval.max;
}

fn swap(a: ptr<function, vec3f>, b: ptr<function, vec3f>, i: i32) {
  let c = (*a)[i];
  (*a)[i] = (*b)[i];
  (*b)[i] = c;
}

/************************************** stack ***************************************/
struct SphereStack {
  top: i32,
  S: array<Sphere, 32>
}

fn makeSphereStack() -> SphereStack {
  var stack: SphereStack;
  stack.top = -1;
  return stack;
}

fn stackIsEmpty(stack: SphereStack) -> bool {
  return select(false, true, stack.top == -1);
}

fn push(stack: ptr<function, SphereStack>, s: Sphere) {
  (*stack).top += 1;
  (*stack).S[(*stack).top] = s;
}

fn pop(stack: ptr<function, SphereStack>) -> Sphere {
  (*stack).top -= 1;
  return (*stack).S[(*stack).top + 1];
}

/**
* https://github.com/martinweber/learn-opengl-raytrace-weekend/blob/develop/src/shader/compute.glsl#L76
* https://registry.khronos.org/OpenGL-Refpages/gl4/html/mod.xhtml
* glsl: mod(x, y) <==> x - y * floor(x/y)
* wgsl: x % y <==> x - y * trunc(x/y)
*/
fn rand(v: vec2f) -> f32 {
  var a = 12.9898;
  var b = 78.233;
  var c = 43758.5453;
  var dt = dot(v, vec2f(a, b));
  var sn = dt - 3.14 * floor(dt / 3.14);
  return fract(sin(sn) * c);
}

fn randomInUnitSphere(pos: vec3f) -> vec3f {
  var p = vec3f(0.0);
  var max = 1000;

  loop {
    if (max < 0) {
      break;
    }
    max--;
    p = 2.0 * vec3f(rand(pos.xy + p.xy), rand(pos.yz + p.yz), rand(pos.xz + p.xz)) - vec3f(1.0);
    if (dot(p, p) < 1.0) {
      break;
    }
  }

  return p;
}

fn defocusDiskSample(pos: vec3f, cameraCenter: vec3f) -> vec3f {
  let p = randomInUnitSphere(pos);
  return cameraCenter + (p.x * camera.defocusDiskU) + (p.y * camera.defocusDiskV);
}

fn randomOnHemisphere(pos: vec3f, normal: vec3f) -> vec3f {
  let onUnitSphere = normalize(randomInUnitSphere(pos));
  if (dot(onUnitSphere, normal) > 0.0) {
    return onUnitSphere;
  } else {
    return -onUnitSphere;
  }
}

fn near_zero(e: vec3f) -> bool {
  let s = 1e-8f;
  return abs(e[0]) < s && abs(e[1]) < s && abs(e[2]) < s;
}
