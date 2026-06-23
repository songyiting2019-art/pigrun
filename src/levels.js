(function () {
window.PigRun = window.PigRun || {};

const CELL_TO_DIRECTION = {
  u: "up",
  d: "down",
  l: "left",
  r: "right",
};

const DIRECTION_TO_CELL = {
  up: "u",
  down: "d",
  left: "l",
  right: "r",
};

const LEVELS = [
  {
    id: "level-1",
    name: "第 1 关",
    rows: [
      "..ul....",
      "u.uull.u",
      "du.u.udu",
      "luu.ru.u",
      "d.ruu.du",
      "d.dul...",
      ".dd.r..r",
      "ldl..dd.",
      ".d.rddrd",
      "ld.llrrr",
    ],
  },
  {
    id: "level-2",
    name: "第 2 关",
    rows: [
      "uullulru",
      ".uuuruur",
      "dl.lu..d",
      "dllrr.u.",
      "d.l...rd",
      "..ud.drd",
      "d.ur..dd",
      "dlud..rd",
      "dldddrrr",
      "l.ll..r.",
    ],
  },
  {
    id: "level-3",
    name: "第 3 关",
    rows: [
      ".l.ur.rr",
      ".urrr.u.",
      "llulurr.",
      ".uduuuru",
      "lu.l.uru",
      "uld..rrd",
      "u.lll.rd",
      "ddrr.ru.",
      "dldlldrr",
      "l.rrrrd.",
    ],
  },
];

function getLevel(index) {
  return LEVELS[index % LEVELS.length];
}

function parseLevelCells(level) {
  const rows = Array.isArray(level) ? level : level.rows;
  return rows.flatMap((row, y) =>
    [...row].flatMap((letter, x) => {
      const dir = CELL_TO_DIRECTION[letter];
      return dir ? [{ x, y, dir }] : [];
    }),
  );
}

function serializeLevelCells(cells, cols, rows) {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "."));
  cells.forEach((cell) => {
    if (cell.x < 0 || cell.y < 0 || cell.x >= cols || cell.y >= rows) return;
    grid[cell.y][cell.x] = DIRECTION_TO_CELL[cell.dir] || ".";
  });
  return grid.map((row) => row.join(""));
}

function validateLevel(level) {
  const rows = Array.isArray(level) ? level : level.rows;
  const issues = [];

  rows.forEach((row, y) => {
    const rightFacing = [];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "r") {
        rightFacing.push(x);
      }
      if (row[x] === "l") {
        rightFacing.forEach((rx) => {
          issues.push({
            type: "faceoff",
            axis: "horizontal",
            from: { x: rx, y, dir: "right" },
            to: { x, y, dir: "left" },
            message: "Two pigs face each other on the same horizontal lane.",
          });
        });
      }
    }
  });

  const colCount = Math.max(...rows.map((row) => row.length));
  for (let x = 0; x < colCount; x += 1) {
    const downFacing = [];
    for (let y = 0; y < rows.length; y += 1) {
      if (rows[y][x] === "d") {
        downFacing.push(y);
      }
      if (rows[y][x] === "u") {
        downFacing.forEach((dy) => {
          issues.push({
            type: "faceoff",
            axis: "vertical",
            from: { x, y: dy, dir: "down" },
            to: { x, y, dir: "up" },
            message: "Two pigs face each other on the same vertical lane.",
          });
        });
      }
    }
  }

  return issues;
}

window.PigRun.levels = {
  cellToDirection: CELL_TO_DIRECTION,
  directionToCell: DIRECTION_TO_CELL,
  list: LEVELS,
  getLevel,
  parseLevelCells,
  serializeLevelCells,
  validateLevel,
};
})();
