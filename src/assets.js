(function () {
window.PigRun = window.PigRun || {};

function createImageMap(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([name, src]) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.onerror = () => {
        image.failed = true;
      };
      return [name, image];
    }),
  );
}

window.PigRun.assets = {
  createImageMap,
};
})();
