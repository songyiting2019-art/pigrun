const canvas = document.querySelector("#gameCanvas");
const mainCtx = canvas.getContext("2d", { alpha: true, desynchronized: true });
let ctx = mainCtx;
const { config, assets, audio, levels } = window.PigRun;
const {
  boardSize,
  directions: dirs,
  pigCollision,
  pigSpritePaths,
  performance: perfConfig,
  toolDefaults,
} = config;
const { getLevel, parseLevelCells, serializeLevelCells, validateLevel } = levels;
const pigSprites = assets.createImageMap(pigSpritePaths);
const backgroundCanvas = document.createElement("canvas");
const backgroundCtx = backgroundCanvas.getContext("2d", { alpha: true });

const scoreEl = document.querySelector("#score");
const levelEl = document.querySelector("#level");
const comboEl = document.querySelector("#combo");
const guideEl = document.querySelector("#guide");
const toastEl = document.querySelector("#toast");
const overlayEl = document.querySelector("#overlay");
const modalTitleEl = document.querySelector("#modalTitle");
const modalTextEl = document.querySelector("#modalText");
const modalButtonEl = document.querySelector("#modalButton");
const pauseButton = document.querySelector("#pauseButton");
const soundButton = document.querySelector("#soundButton");

const tools = {
  remove: {
    button: document.querySelector("#removeTool"),
    countEl: document.querySelector("#removeCount"),
    count: toolDefaults.remove,
  },
  shuffle: {
    button: document.querySelector("#shuffleTool"),
    countEl: document.querySelector("#shuffleCount"),
    count: toolDefaults.shuffle,
  },
  flip: {
    button: document.querySelector("#flipTool"),
    countEl: document.querySelector("#flipCount"),
    count: toolDefaults.flip,
  },
};

const board = {
  cols: boardSize.cols,
  rows: boardSize.rows,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  cell: 0,
};

const state = {
  level: 1,
  score: 0,
  combo: 0,
  pigs: [],
  particles: [],
  activeTool: null,
  paused: false,
  muted: false,
  lastTime: performance.now(),
  toastTimer: 0,
  levelCompleteTimer: 0,
};

const render = {
  ratio: 1,
  frameInterval: 1000 / (perfConfig.targetFps || 30),
  maxParticles: perfConfig.maxParticles || 90,
};

const sound = audio.createSoundManager(() => state.muted);

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, perfConfig.maxPixelRatio || 1.5);
  const rect = canvas.getBoundingClientRect();
  render.ratio = ratio;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  mainCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  mainCtx.imageSmoothingEnabled = true;
  mainCtx.imageSmoothingQuality = "medium";

  backgroundCanvas.width = canvas.width;
  backgroundCanvas.height = canvas.height;
  backgroundCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  backgroundCtx.imageSmoothingEnabled = true;
  backgroundCtx.imageSmoothingQuality = "medium";

  const playW = Math.min(rect.width - 54, 350);
  const top = rect.height < 720 ? 142 : 182;
  const bottom = rect.height < 720 ? 100 : 124;
  const availableH = rect.height - top - bottom;
  board.cell = Math.floor(Math.min(playW / board.cols, availableH / board.rows));
  board.w = board.cell * board.cols;
  board.h = board.cell * board.rows;
  board.x = (rect.width - board.w) / 2;
  board.y = top + (availableH - board.h) / 2;
  renderBackgroundCache();
}

function buildLevel() {
  const level = getLevel(state.level - 1);
  state.pigs = parseLevelCells(level).map((cell) => ({
    id: `${level.id}-${cell.x}-${cell.y}-${Math.random().toString(16).slice(2)}`,
    x: cell.x,
    y: cell.y,
    px: cell.x,
    py: cell.y,
    dir: cell.dir,
    exiting: false,
    remove: false,
    wobble: Math.random() * Math.PI * 2,
    runPhase: Math.random() * Math.PI * 2,
  }));
  state.combo = 0;
  state.levelCompleteTimer = 0;
  resetToolCounts();
  guideEl.classList.remove("hidden");
  overlayEl.classList.add("hidden");
  syncUi();
}

function resetToolCounts() {
  tools.remove.count = toolDefaults.remove;
  tools.shuffle.count = toolDefaults.shuffle;
  tools.flip.count = toolDefaults.flip;
  clearTool();
}

function syncUi() {
  scoreEl.textContent = state.score;
  levelEl.textContent = state.level;
  Object.values(tools).forEach((tool) => {
    tool.countEl.textContent = tool.count;
    tool.button.disabled = tool.count <= 0;
  });
}

function drawScene(time) {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.drawImage(backgroundCanvas, 0, 0, canvas.clientWidth, canvas.clientHeight);
  [...state.pigs].sort((a, b) => a.py - b.py).forEach((pig) => drawPig(pig, time));
  drawParticles();
}

function renderBackgroundCache() {
  withRenderContext(backgroundCtx, () => {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    drawFarm();
    drawBoard();
  });
}

function withRenderContext(nextCtx, draw) {
  const previousCtx = ctx;
  ctx = nextCtx;
  try {
    draw();
  } finally {
    ctx = previousCtx;
  }
}

function drawFarm() {
  const width = canvas.clientWidth;
  drawTree(30, 72, 1.05);
  drawTree(width - 56, 90, 0.92);
  drawTree(34, canvas.clientHeight - 72, 1);
  drawTree(width - 45, canvas.clientHeight - 94, 1.08);
  drawBarn(width - 102, 46);
  drawGate(board.x + board.w - 24, board.y - 28, "top");
  drawGate(board.x + 4, board.y + board.h + 16, "bottom");
  drawFlowers();
}

function drawTree(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#26793b";
  rounded(-13, 14, 26, 36, 9);
  ctx.fill();
  ctx.fillStyle = "#35a843";
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 18, Math.sin(a) * 11, 19, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, -6, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBarn(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#fff1c6";
  rounded(0, 0, 78, 68, 8);
  ctx.fill();
  ctx.strokeStyle = "#8c552d";
  ctx.lineWidth = 7;
  ctx.strokeRect(7, 8, 64, 52);
  ctx.beginPath();
  ctx.moveTo(5, 8);
  ctx.lineTo(39, -18);
  ctx.lineTo(73, 8);
  ctx.stroke();
  ctx.fillStyle = "#5a3926";
  rounded(25, 25, 31, 35, 15);
  ctx.fill();
  ctx.fillStyle = "#fff9d9";
  ctx.beginPath();
  ctx.arc(49, 43, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGate(x, y, side) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side === "top" ? 0.62 : -2.52);
  ctx.fillStyle = "#c98236";
  for (let i = 0; i < 4; i += 1) {
    rounded(i * 12, 0, 9, 32, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawFlowers() {
  const seeds = [
    [38, 180],
    [356, 154],
    [390, 630],
    [52, 584],
    [82, 130],
    [332, 702],
  ];
  seeds.forEach(([x, y], index) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(index);
    ctx.fillStyle = index % 2 ? "#ff86c7" : "#fff7de";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 5, 3, 7, (Math.PI * 2 * i) / 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffd84b";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBoard() {
  ctx.save();
  ctx.fillStyle = "#56d34c";
  rounded(board.x - 7, board.y - 7, board.w + 14, board.h + 14, 24);
  ctx.fill();
  ctx.clip();

  for (let y = 0; y < board.rows; y += 1) {
    for (let x = 0; x < board.cols; x += 1) {
      ctx.fillStyle = (x + y) % 2 ? "#5bd754" : "#4fcf48";
      ctx.fillRect(board.x + x * board.cell, board.y + y * board.cell, board.cell, board.cell);
    }
  }

  ctx.restore();
}

function drawPig(pig, time) {
  const cx = board.x + (pig.px + 0.5) * board.cell;
  const cy = board.y + (pig.py + 0.5) * board.cell;
  const moving = pig.exiting || pig.charge;
  const runWave = moving ? Math.sin(pig.runPhase || 0) : 0;
  const runStep = moving ? Math.abs(runWave) : 0;
  const dir = dirs[pig.dir];
  const dizzyWave = pig.dizzyLife > 0 ? Math.sin(time / 48) * 2 : 0;
  const bob = moving ? -runStep * board.cell * 0.13 : Math.sin(time / 120 + pig.wobble) * 1;
  const lunge = moving ? Math.cos(pig.runPhase || 0) * board.cell * 0.035 : 0;
  const sway = moving ? runWave * board.cell * 0.05 : 0;

  ctx.save();
  ctx.translate(cx + dizzyWave + dir.x * lunge - dir.y * sway, cy + bob + dir.y * lunge + dir.x * sway);
  ctx.globalAlpha = pig.remove ? 0.45 : 1;

  ctx.fillStyle = "rgba(36, 80, 35, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, board.cell * (0.2 + runStep * 0.04), board.cell * (0.48 - runStep * 0.04), board.cell * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprite = pig.dir === "up" ? pigSprites.up : pig.dir === "down" ? pigSprites.down : pigSprites.right;
  if (sprite.complete && sprite.naturalWidth > 0) {
    const drawSize = board.cell * 1.58;
    ctx.rotate(runWave * 0.035);
    ctx.scale((pig.dir === "left" ? -1 : 1) * (1 + runStep * 0.07), 1 - runStep * 0.055);
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
    if (pig.dizzyLife > 0) {
      drawOrbitingStars(pig, time, cx + dizzyWave, cy + bob);
    }
    return;
  }

  ctx.rotate(runWave * 0.035);
  ctx.scale(pig.dir === "left" ? -1 : 1, 1);
  drawFallbackPig(pig, runStep);
  ctx.restore();
  if (pig.dizzyLife > 0) {
    drawOrbitingStars(pig, time, cx + dizzyWave, cy + bob);
  }
}

function drawFallbackPig(pig, runStep) {
  const size = board.cell;
  const side = pig.dir === "left" || pig.dir === "right";
  const back = pig.dir === "up";

  ctx.fillStyle = "#f7a1ac";
  ctx.strokeStyle = "#d8707d";
  ctx.lineWidth = Math.max(1, size * 0.035);

  ctx.beginPath();
  ctx.ellipse(0, size * 0.02, size * (side ? 0.45 : 0.39), size * (side ? 0.32 : 0.43), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (side) {
    ctx.beginPath();
    ctx.ellipse(size * 0.32, -size * 0.02, size * 0.22, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawFallbackEar(size * 0.24, -size * 0.2, size);
    drawFallbackEar(size * 0.39, -size * 0.16, size);
    drawFallbackSnout(size * 0.48, size * 0.02, size);
    drawFallbackEye(size * 0.34, -size * 0.06, size);
    drawFallbackTail(-size * 0.42, -size * 0.03, size);
  } else if (back) {
    drawFallbackEar(-size * 0.2, -size * 0.24, size);
    drawFallbackEar(size * 0.2, -size * 0.24, size);
    drawFallbackTail(size * 0.29, size * 0.02, size);
  } else {
    drawFallbackEar(-size * 0.22, -size * 0.23, size);
    drawFallbackEar(size * 0.22, -size * 0.23, size);
    drawFallbackSnout(0, size * 0.1, size);
    drawFallbackEye(-size * 0.15, -size * 0.04, size);
    drawFallbackEye(size * 0.15, -size * 0.04, size);
  }

  drawFallbackLegs(size, runStep);
}

function drawFallbackEar(x, y, size) {
  ctx.fillStyle = "#f58c9a";
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.08);
  ctx.lineTo(x - size * 0.08, y + size * 0.08);
  ctx.lineTo(x + size * 0.08, y + size * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7a1ac";
}

function drawFallbackSnout(x, y, size) {
  ctx.fillStyle = "#f48d9a";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.13, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7b4a50";
  ctx.beginPath();
  ctx.arc(x - size * 0.04, y, size * 0.014, 0, Math.PI * 2);
  ctx.arc(x + size * 0.04, y, size * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7a1ac";
}

function drawFallbackEye(x, y, size) {
  ctx.fillStyle = "#49333a";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7a1ac";
}

function drawFallbackTail(x, y, size) {
  ctx.strokeStyle = "#d8707d";
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.07, 0.2, Math.PI * 1.7);
  ctx.stroke();
}

function drawFallbackLegs(size, runStep) {
  ctx.fillStyle = "#e7828e";
  const lift = runStep * size * 0.04;
  [[-0.22, 0.31 + lift / size], [0.22, 0.31 - lift / size]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(size * x, size * y, size * 0.07, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOrbitingStars(pig, time, cx, cy) {
  const dir = dirs[pig.dir];
  const centerX = cx + dir.x * board.cell * 0.2;
  const centerY = cy + dir.y * board.cell * 0.2 - board.cell * 0.54;
  const orbit = time / 170;
  for (let i = 0; i < 3; i += 1) {
    const angle = orbit + (Math.PI * 2 * i) / 3;
    const x = centerX + Math.cos(angle) * board.cell * 0.28;
    const y = centerY + Math.sin(angle) * board.cell * 0.12;
    drawStar(x, y, board.cell * 0.095, -angle);
  }
}

function drawParticles() {
  state.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    if (p.kind === "star") {
      drawStar(p.x, p.y, p.size, p.spin);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawStar(x, y, radius, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = "#ffe46a";
  ctx.strokeStyle = "#b76d1c";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? radius * 0.48 : radius;
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function rounded(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pigAtCell(x, y, ignoredPig = null) {
  return state.pigs.find((pig) => pig !== ignoredPig && !pig.exiting && pig.x === x && pig.y === y);
}

function pigAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const x = Math.floor((localX - board.x) / board.cell);
  const y = Math.floor((localY - board.y) / board.cell);
  const cellPig = x >= 0 && y >= 0 && x < board.cols && y < board.rows ? pigAtCell(x, y) : null;
  if (cellPig) return cellPig;

  const hits = [];
  state.pigs.forEach((pig) => {
    if (pig.exiting || pig.remove) return;
    const cx = board.x + (pig.px + 0.5) * board.cell;
    const cy = board.y + (pig.py + 0.5) * board.cell;
    const dx = localX - cx;
    const dy = localY - cy;
    const hitX = board.cell * 0.5;
    const hitY = board.cell * 0.52;
    const normalized = (dx * dx) / (hitX * hitX) + (dy * dy) / (hitY * hitY);
    if (normalized <= 1) {
      hits.push({ pig, normalized });
    }
  });
  if (hits.length !== 1) return null;
  return hits[0].pig;
}

function canExit(pig) {
  return tracePath(pig).canExit;
}

function tracePath(pig) {
  const dir = dirs[pig.dir];
  let x = pig.x + dir.x;
  let y = pig.y + dir.y;
  let stopX = pig.x;
  let stopY = pig.y;
  while (x >= 0 && y >= 0 && x < board.cols && y < board.rows) {
    const blocker = pigBlockingBodyAt(x, y, pig, dir);
    if (blocker) {
      return { canExit: false, stopX, stopY, hitX: blocker.x, hitY: blocker.y };
    }
    stopX = x;
    stopY = y;
    x += dir.x;
    y += dir.y;
  }
  return { canExit: true, stopX, stopY };
}

function pigBlockingBodyAt(x, y, ignoredPig, dir) {
  return state.pigs.find((pig) => {
    if (pig === ignoredPig || pig.exiting) return false;
    const dx = pig.x - x;
    const dy = pig.y - y;
    const forwardOverlap = Math.abs(dx * dir.x + dy * dir.y);
    const sideOverlap = Math.abs(dx * dir.y - dy * dir.x);
    return forwardOverlap < pigCollision.laneDepth && sideOverlap < pigCollision.laneHalfWidth;
  });
}

function sendPigHome(pig) {
  if (pig.exiting || pig.charge) return;
  pig.exiting = true;
  pig.dustTimer = 0;
  state.combo += 1;
  const gained = 10 + Math.min(state.combo, 9) * 2;
  state.score += gained;
  showCombo();
  makeDust(pig);
  sound.pigRun();
  syncUi();

  const target = getOffscreenTarget(pig);
  pig.targetX = target.x;
  pig.targetY = target.y;
  pig.speed = 8.4;
}

function getOffscreenTarget(pig) {
  const margin = 2.2;
  if (pig.dir === "up") {
    return { x: pig.x, y: -board.y / board.cell - margin };
  }
  if (pig.dir === "down") {
    return { x: pig.x, y: (canvas.clientHeight - board.y) / board.cell + margin };
  }
  if (pig.dir === "left") {
    return { x: -board.x / board.cell - margin, y: pig.y };
  }
  return { x: (canvas.clientWidth - board.x) / board.cell + margin, y: pig.y };
}

function makeDust(pig) {
  makeDustAt(pig.px, pig.py, 10);
}

function makeDustAt(gridX, gridY, count = 8) {
  const cx = board.x + (gridX + 0.5) * board.cell;
  const cy = board.y + (gridY + 0.5) * board.cell;
  for (let i = 0; i < count; i += 1) {
    addParticle({
      x: cx + (Math.random() - 0.5) * board.cell * 0.42,
      y: cy + (Math.random() - 0.5) * board.cell * 0.42,
      vx: (Math.random() - 0.5) * 1.9,
      vy: (Math.random() - 0.5) * 1.9,
      life: 0.85,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.35 ? "#fff8e0" : "#d8e8b7",
    });
  }
}

function makeRunDust(pig, count = 4) {
  const dir = dirs[pig.dir];
  const cx = board.x + (pig.px + 0.5 - dir.x * 0.34) * board.cell;
  const cy = board.y + (pig.py + 0.5 - dir.y * 0.34) * board.cell;
  for (let i = 0; i < count; i += 1) {
    addParticle({
      x: cx + (Math.random() - 0.5) * board.cell * 0.5,
      y: cy + (Math.random() - 0.5) * board.cell * 0.35,
      vx: -dir.x * (0.8 + Math.random() * 0.9) + (Math.random() - 0.5) * 0.7,
      vy: -dir.y * (0.8 + Math.random() * 0.9) + (Math.random() - 0.5) * 0.7,
      life: 0.7,
      size: 2.4 + Math.random() * 3.4,
      color: Math.random() > 0.28 ? "#fff8e0" : "#dce9bc",
    });
  }
}

function addParticle(particle) {
  state.particles.push(particle);
  if (state.particles.length > render.maxParticles) {
    state.particles.splice(0, state.particles.length - render.maxParticles);
  }
}

function showCombo() {
  comboEl.textContent = `连击 x ${state.combo}`;
  comboEl.classList.add("show");
  window.clearTimeout(state.comboTimer);
  state.comboTimer = window.setTimeout(() => comboEl.classList.remove("show"), 900);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 900);
}

function useRemoveTool(pig) {
  if (!pig || tools.remove.count <= 0) return;
  tools.remove.count -= 1;
  pig.remove = true;
  makeDust(pig);
  sound.tool();
  setTimeout(() => {
    state.pigs = state.pigs.filter((item) => item !== pig);
    syncUi();
    checkComplete();
  }, 160);
  clearTool();
  syncUi();
}

function useShuffleTool() {
  if (tools.shuffle.count <= 0) return;
  const shuffled = createValidShuffle();
  if (!shuffled) {
    showToast("这局不能安全洗牌");
    return;
  }
  tools.shuffle.count -= 1;
  state.pigs.filter((pig) => !pig.exiting).forEach((pig, index) => {
    pig.x = shuffled[index].x;
    pig.y = shuffled[index].y;
  });
  sound.tool();
  clearTool();
  syncUi();
}

function createValidShuffle() {
  const livePigs = state.pigs.filter((pig) => !pig.exiting);
  const originalPositions = livePigs.map((pig) => ({ x: pig.x, y: pig.y }));
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const positions = originalPositions.map((position) => ({ ...position }));
    shuffle(positions);
    const cells = livePigs.map((pig, index) => ({
      x: positions[index].x,
      y: positions[index].y,
      dir: pig.dir,
    }));
    const rows = serializeLevelCells(cells, board.cols, board.rows);
    if (validateLevel(rows).length === 0) {
      return positions;
    }
  }
  return null;
}

function useFlipTool() {
  if (tools.flip.count <= 0) return;
  tools.flip.count -= 1;
  state.pigs.filter((pig) => !pig.exiting).forEach((pig) => {
    pig.dir = { up: "down", down: "up", left: "right", right: "left" }[pig.dir];
  });
  sound.tool();
  clearTool();
  syncUi();
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function clearTool() {
  state.activeTool = null;
  Object.values(tools).forEach((tool) => tool.button.classList.remove("active"));
}

function selectTool(name) {
  if (tools[name].count <= 0) return;
  if (state.activeTool === name) {
    clearTool();
    return;
  }
  clearTool();
  state.activeTool = name;
  tools[name].button.classList.add("active");
}

function handleTap(event) {
  event.preventDefault();
  if (state.paused || !overlayEl.classList.contains("hidden")) return;
  guideEl.classList.add("hidden");
  const pig = pigAtPoint(event.clientX, event.clientY);
  if (state.activeTool === "remove") {
    useRemoveTool(pig);
    return;
  }
  if (!pig) {
    clearTool();
    return;
  }
  if (pig.exiting || pig.charge || pig.dizzyLife > 0) return;
  if (canExit(pig)) {
    sendPigHome(pig);
  } else {
    state.combo = 0;
    chargeBlockedPig(pig);
  }
}

function chargeBlockedPig(pig) {
  const path = tracePath(pig);
  const dir = dirs[pig.dir];
  const oldX = pig.x;
  const oldY = pig.y;
  pig.x = path.stopX;
  pig.y = path.stopY;
  pig.charge = {
    phase: "run",
    targetX: path.stopX + dir.x * 0.13,
    targetY: path.stopY + dir.y * 0.13,
    settleX: path.stopX,
    settleY: path.stopY,
    timer: 0,
  };
  pig.dustTimer = 0;
  if (oldX === path.stopX && oldY === path.stopY) {
    makeDustAt(pig.px, pig.py, 6);
  } else {
    makeDustAt(oldX, oldY, 12);
  }
}

function update(dt) {
  if (state.paused) return;

  state.pigs.forEach((pig) => {
    if (pig.exiting) {
      pig.runPhase = (pig.runPhase || 0) + dt * 0.026;
      const dx = pig.targetX - pig.px;
      const dy = pig.targetY - pig.py;
      const dist = Math.hypot(dx, dy);
      const step = (pig.speed * dt) / 1000;
      if (dist < step) {
        pig.px = pig.targetX;
        pig.py = pig.targetY;
      } else {
        pig.px += (dx / dist) * step;
        pig.py += (dy / dist) * step;
      }
      pig.dustTimer = (pig.dustTimer || 0) - dt;
      if (pig.dustTimer <= 0) {
        makeRunDust(pig, 5);
        pig.dustTimer = 55;
      }
    } else if (pig.charge) {
      updateBlockedCharge(pig, dt);
    } else {
      pig.px += (pig.x - pig.px) * Math.min(1, dt / 120);
      pig.py += (pig.y - pig.py) * Math.min(1, dt / 120);
      if (pig.dizzyLife > 0) {
        pig.dizzyLife = Math.max(0, pig.dizzyLife - dt / 650);
      }
    }
  });

  state.pigs = state.pigs.filter((pig) => {
    if (!pig.exiting) return true;
    return isPigVisibleOnScreen(pig);
  });

  state.particles.forEach((p) => {
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    if (p.kind === "star") {
      p.spin += (p.spinSpeed || 0) * (dt / 16);
    }
    p.life -= dt / 520;
  });
  state.particles = state.particles.filter((p) => p.life > 0);

  checkComplete();
}

function isPigVisibleOnScreen(pig) {
  const margin = board.cell * 1.4;
  const x = board.x + (pig.px + 0.5) * board.cell;
  const y = board.y + (pig.py + 0.5) * board.cell;
  return x > -margin && y > -margin && x < canvas.clientWidth + margin && y < canvas.clientHeight + margin;
}

function updateBlockedCharge(pig, dt) {
  const charge = pig.charge;
  pig.runPhase = (pig.runPhase || 0) + dt * 0.03;
  const speed = charge.phase === "run" ? 7.2 : 4.8;
  const targetX = charge.phase === "run" ? charge.targetX : charge.settleX;
  const targetY = charge.phase === "run" ? charge.targetY : charge.settleY;
  const dx = targetX - pig.px;
  const dy = targetY - pig.py;
  const dist = Math.hypot(dx, dy);
  const step = (speed * dt) / 1000;

  if (dist <= step || dist < 0.015) {
    pig.px = targetX;
    pig.py = targetY;
    if (charge.phase === "run") {
      charge.phase = "recoil";
      makeDustAt(pig.px, pig.py, 10);
      pig.dizzyLife = 1;
      sound.pigImpact();
    } else {
      pig.px = charge.settleX;
      pig.py = charge.settleY;
      pig.charge = null;
    }
    return;
  }

  pig.px += (dx / dist) * step;
  pig.py += (dy / dist) * step;
  pig.dustTimer = (pig.dustTimer || 0) - dt;
  if (pig.dustTimer <= 0) {
    makeRunDust(pig, 4);
    pig.dustTimer = 52;
  }
}

function checkComplete() {
  if (state.levelCompleteTimer || state.pigs.some((pig) => !pig.exiting)) return;
  state.levelCompleteTimer = window.setTimeout(() => {
    modalTitleEl.textContent = "过关啦";
    modalTextEl.textContent = `本关得分 ${state.score}，继续让小猪回家。`;
    modalButtonEl.textContent = "下一关";
    overlayEl.classList.remove("hidden");
    sound.levelComplete();
  }, 480);
}

function loop(now) {
  const elapsed = now - state.lastTime;
  if (elapsed < render.frameInterval) {
    requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min(64, elapsed);
  state.lastTime = now;
  update(dt);
  drawScene(now);
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointerdown", handleTap, { passive: false });

tools.remove.button.addEventListener("click", () => selectTool("remove"));
tools.shuffle.button.addEventListener("click", useShuffleTool);
tools.flip.button.addEventListener("click", useFlipTool);

pauseButton.addEventListener("click", () => {
  state.paused = !state.paused;
  modalTitleEl.textContent = state.paused ? "暂停中" : "继续啦";
  modalTextEl.textContent = state.paused ? "休息一下，准备好了再继续。" : "小猪已经重新站好。";
  modalButtonEl.textContent = state.paused ? "继续" : "知道了";
  overlayEl.classList.toggle("hidden", !state.paused);
});

soundButton.addEventListener("click", () => {
  state.muted = !state.muted;
  soundButton.textContent = state.muted ? "×" : "♪";
});

modalButtonEl.addEventListener("click", () => {
  if (state.paused) {
    state.paused = false;
    overlayEl.classList.add("hidden");
    return;
  }
  state.level += 1;
  buildLevel();
});

window.addEventListener("resize", resize);
resize();
buildLevel();
requestAnimationFrame(loop);
