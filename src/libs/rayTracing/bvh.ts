import {Sphere} from './sphere';
import {Bounds} from './bounds3';

class Node {
  bounds = new Bounds();
  leftChild: null | Node = null;
  rightChild: null | Node = null;
  parentIndex = -1;
  leftIndex = -1;
  rightIndex = -1;
  sphere?: Sphere;
  childType?: 'left' | 'right';
}

export class BVH {
  public nodes: Node[] = [];
  private root: Node;

  constructor(objects: Sphere[]) {
    this.root = this.buildBVH(objects);
    this.flattenBVHTree();
  }

  private buildBVH(objects: Sphere[]): Node {
    const node = new Node();

    if (objects.length === 1) {
      node.bounds = objects[0].bbox;
      node.sphere = objects[0];
      return node;
    }

    if (objects.length === 2) {
      node.leftChild = this.buildBVH([objects[0]]);
      node.rightChild = this.buildBVH([objects[1]]);
      node.bounds = new Bounds(node.leftChild.bounds, node.rightChild.bounds);
      return node;
    }

    let centroidBounds = new Bounds();
    objects.forEach((object) => {
      centroidBounds = new Bounds(centroidBounds, object.bbox.centroid());
    });
    const axis = centroidBounds.maxExtent();

    switch (axis) {
      case 0:
        objects.sort((object1, object2) => object1.bbox.pMin[0] - object2.bbox.pMin[0]);
        break;
      case 1:
        objects.sort((object1, object2) => object1.bbox.pMin[1] - object2.bbox.pMin[1]);
        break;
      case 2:
        objects.sort((object1, object2) => object1.bbox.pMin[2] - object2.bbox.pMin[2]);
        break;
    }

    const mid = Math.floor(objects.length / 2);
    node.leftChild = this.buildBVH(objects.slice(0, mid));
    node.rightChild = this.buildBVH(objects.slice(mid));
    node.bounds = new Bounds(node.leftChild.bounds, node.rightChild.bounds);
    return node;
  }

  private flattenBVHTree() {
    const stack = [this.root];
    let currentIndex = -1;

    this.root.parentIndex = -1;

    while(stack.length > 0) {
      const node = <Node>stack.pop();
      this.nodes.push(node);
      currentIndex++;

      if (node.parentIndex !== -1) {
        const parentNode = this.nodes[node.parentIndex];
        const i = this.nodes.length - 1;

        if (node.childType === 'left') {
          parentNode.leftIndex = i;
        } else if (node.childType === 'right') {
          parentNode.rightIndex = i;
        }
      }

      if (node.rightChild) {
        node.rightChild.parentIndex = currentIndex;
        node.rightChild.childType = 'right';
        stack.push(node.rightChild);
      }

      if (node.leftChild) {
        node.leftChild.parentIndex = currentIndex;
        node.leftChild.childType = 'left';
        stack.push(node.leftChild);
      }
    }
  }
}