(function () {
window.PigRun = window.PigRun || {};

function createImageMap(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([name, src]) => {
      const image = new Image();
      image.src = src;
      return [name, image];
    }),
  );
}

window.PigRun.assets = {
  createImageMap,
};
})();
