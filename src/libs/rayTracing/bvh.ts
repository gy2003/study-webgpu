import {Sphere} from './sphere';
import {Bounds} from './bounds3';

interface Node {
  object?: Sphere;
  bounds: Bounds;
  left: Node | null;
  right: Node | null;
}

export class BVH {
  private root: Node;

  count = 0;

  constructor(objects: Sphere[]) {
    this.root = this.buildBVH(objects);
  }

  private buildBVH(objects: Sphere[]): Node {
    this.count += 1;
    const node: Node = {
      left: null,
      right: null,
      bounds: new Bounds(),
    };

    if (objects.length === 1) {
      node.bounds = objects[0].bbox;
      node.object = objects[0];
      return node;
    }

    if (objects.length === 2) {
      node.left = this.buildBVH([objects[0]]);
      node.right = this.buildBVH([objects[1]]);
      node.bounds = new Bounds(node.left.bounds, node.right.bounds);
      return node;
    }

    let centroidBounds = new Bounds();
    objects.forEach((object) => {
      centroidBounds = new Bounds(centroidBounds, object.bbox.centroid());
    });
    const dim = centroidBounds.maxExtent();

    switch (dim) {
      case 0:
        objects.sort((object1, object2) => object1.bbox.centroid()[0] - object2.bbox.centroid()[0]);
        break;
      case 1:
        objects.sort((object1, object2) => object1.bbox.centroid()[1] - object2.bbox.centroid()[1]);
        break;
      case 2:
        objects.sort((object1, object2) => object1.bbox.centroid()[2] - object2.bbox.centroid()[2]);
        break;
    }

    const middle = (objects.length / 2) | 0;
    node.left = this.buildBVH(objects.slice(0, middle));
    node.right = this.buildBVH(objects.slice(middle));
    node.bounds = new Bounds(node.left.bounds, node.right.bounds);
    return node;
  }

  bfs(callback: (node: Node) => void) {
    const queue = [this.root];

    while(queue.length > 0) {
      const node = <Node>queue.shift();
      callback(node);

      if (node.left !== null) {
        queue.push(node.left);
      }

      if (node.right !== null) {
        queue.push(node.right);
      }
    }
  }
}
