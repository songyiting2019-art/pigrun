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
      "rdu..urr",
      "ldu..ldd",
      "ur..ddrr",
      "rduul...",
      "ll..rrdd",
      "uurr..rr",
      "dd..uurr",
      "...rddl.",
      "rruulldd",
      "l..u..dr",
    ],
  },
  {
    id: "level-2",
    name: "第 2 关",
    rows: [
      "rrddlluu",
      "u..r..dl",
      "ddrruull",
      "lrrrddlu",
      "..llrr..",
      "rduulldr",
      "llrruudd",
      "d..l..rr",
      "rurrddll",
      "ldrurrdr",
    ],
  },
  {
    id: "level-3",
    name: "第 3 关",
    rows: [
      "druldrul",
      "r..d..lu",
      "uurrrudd",
      "ddlurrrr",
      "rr..ul..",
      "uullddrr",
      "ldrrrrud",
      "d..u..rr",
      "rrddlluu",
      "uldruldr",
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
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== "r") continue;
      for (let tx = x + 1; tx < row.length; tx += 1) {
        if (row[tx] === ".") continue;
        if (row[tx] === "l") {
          issues.push({
            type: "faceoff",
            axis: "horizontal",
            from: { x, y, dir: "right" },
            to: { x: tx, y, dir: "left" },
            message: "Two pigs face each other on a clear horizontal lane.",
          });
        }
        break;
      }
    }
  });

  const colCount = Math.max(...rows.map((row) => row.length));
  for (let x = 0; x < colCount; x += 1) {
    for (let y = 0; y < rows.length; y += 1) {
      if (rows[y][x] !== "d") continue;
      for (let ty = y + 1; ty < rows.length; ty += 1) {
        const cell = rows[ty][x];
        if (cell === ".") continue;
        if (cell === "u") {
          issues.push({
            type: "faceoff",
            axis: "vertical",
            from: { x, y, dir: "down" },
            to: { x, y: ty, dir: "up" },
            message: "Two pigs face each other on a clear vertical lane.",
          });
        }
        break;
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
