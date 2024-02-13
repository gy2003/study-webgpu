override workgroupSize: i32 = 8;

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellIndex(cell: vec2u) -> u32 {
  return (cell.y % u32(grid.y)) * u32(grid.x) + (cell.x % u32(grid.x));
}

fn cellActive(x: u32, y: u32) -> i32 {
  return i32(cellStateIn[cellIndex(vec2u(x, y))]);
}

@compute @workgroup_size(workgroupSize, workgroupSize)
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
  let activeNeighbors = cellActive(cell.x + u32(1), cell.y + u32(1)) +
                        cellActive(cell.x + u32(1), cell.y) +
                        cellActive(cell.x + u32(1), cell.y - u32(1)) +
                        cellActive(cell.x, cell.y - u32(1)) +
                        cellActive(cell.x - u32(1), cell.y - u32(1)) +
                        cellActive(cell.x - u32(1), cell.y) +
                        cellActive(cell.x - u32(1), cell.y + u32(1)) +
                        cellActive(cell.x, cell.y + u32(1));
  
  let i = cellIndex(cell.xy);

  switch activeNeighbors {
    case 2: {
      cellStateOut[i] = cellStateIn[i];
    }

    case 3: {
      cellStateOut[i] = u32(1);
    }

    default {
      cellStateOut[i] = u32(0);
    }
  }
}

