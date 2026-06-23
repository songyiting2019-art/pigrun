(function () {
window.PigRun = window.PigRun || {};

window.PigRun.config = {
  boardSize: {
    cols: 9,
    rows: 12,
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
    footprintLength: 2,
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
    right: "./assets/pig-sprite.png?v=8",
    up: "./assets/pig-up.png?v=8",
    down: "./assets/pig-down.png?v=8",
  },
};
})();
