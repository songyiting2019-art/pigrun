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

const DIRECTION_VECTORS = {
  u: { x: 0, y: -1 },
  d: { x: 0, y: 1 },
  l: { x: -1, y: 0 },
  r: { x: 1, y: 0 },
};

const FOOTPRINT_LENGTH = 2;

const LEVELS = [
  {
    id: "level-1",
    name: "第 1 关",
    rows: [
      "ul..r..ru",
      ".ul.u..r.",
      "......r.r",
      "dl.l.l...",
      "...ru.r..",
      ".u.r..rd.",
      "d...r.r..",
      ".....r.dd",
      "d..l....r",
      ".dl......",
      "..l.d.rdd",
      "l..l....r",
    ],
  },
  {
    id: "level-2",
    name: "第 2 关",
    rows: [
      "..l...r.r",
      "....ru.ru",
      ".ddu..u..",
      ".....r...",
      "l.dl.u...",
      "....r..r.",
      ".d.l..rud",
      "l.d...r..",
      ".l.l.....",
      "dl.l.l.dd",
      "..l.l..r.",
      "ddl.l..rd",
    ],
  },
  {
    id: "level-3",
    name: "第 3 关",
    rows: [
      "....r.r.r",
      "ul.uu.r..",
      ".l......u",
      "l.l.l..r.",
      "..l...r.u",
      "....l..r.",
      ".d.d.....",
      "...r.d.d.",
      "d.r..rd..",
      ".l.l....d",
      "dl...r.r.",
      "l..r...rd",
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
  const occupied = new Map();
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length));

  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const dir = DIRECTION_VECTORS[letter];
      if (!dir) return;

      for (let i = 0; i < FOOTPRINT_LENGTH; i += 1) {
        const cell = { x: x - dir.x * i, y: y - dir.y * i };
        if (cell.x < 0 || cell.y < 0 || cell.x >= colCount || cell.y >= rowCount) {
          issues.push({
            type: "footprint",
            from: { x, y, dir: CELL_TO_DIRECTION[letter] },
            message: "A pig footprint extends outside the board.",
          });
          continue;
        }

        const key = `${cell.x},${cell.y}`;
        if (occupied.has(key)) {
          issues.push({
            type: "overlap",
            from: { x, y, dir: CELL_TO_DIRECTION[letter] },
            to: occupied.get(key),
            message: "Two pig footprints overlap.",
          });
        } else {
          occupied.set(key, { x, y, dir: CELL_TO_DIRECTION[letter] });
        }
      }
    });
  });

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
