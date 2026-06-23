(function () {
window.PigRun = window.PigRun || {};

window.PigRun.config = {
  boardSize: {
    cols: 8,
    rows: 10,
  },
  directions: {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  },
  pigCollision: {
    laneHalfWidth: 0.56,
    laneDepth: 0.62,
  },
  performance: {
    maxPixelRatio: 1.5,
    targetFps: 30,
    maxParticles: 90,
  },
  toolDefaults: {
    remove: 3,
    shuffle: 3,
    flip: 3,
  },
  pigSpritePaths: {
    right: "./assets/pig-sprite.png?v=6",
    up: "./assets/pig-up.png?v=6",
    down: "./assets/pig-down.png?v=6",
  },
};
})();
