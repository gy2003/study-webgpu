import {MaterialType, Material} from './material';

export class Dielectric extends Material {
  public type = MaterialType.Dielectric;
  private ir: number;

  constructor(ir: number) {
    super();

    this.ir = ir;
  }

  public getMaterialData(): number[] {
    return [this.ir];
  }
}