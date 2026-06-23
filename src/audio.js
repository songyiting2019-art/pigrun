(function () {
window.PigRun = window.PigRun || {};

function createSoundManager(isMuted) {
  let audioContext;

  function getContext() {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }

  function playTone({ freq, endFreq = freq, duration = 0.16, type = "sine", gain = 0.05, delay = 0 }) {
    if (isMuted()) return;
    const ctx = getContext();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const volume = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.018);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(volume);
    volume.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function pigRun() {
    playTone({ freq: 320, endFreq: 210, duration: 0.12, type: "square", gain: 0.026 });
    playTone({ freq: 520, endFreq: 380, duration: 0.09, type: "triangle", gain: 0.02, delay: 0.035 });
  }

  function pigImpact() {
    playTone({ freq: 260, endFreq: 130, duration: 0.18, type: "sawtooth", gain: 0.045 });
    playTone({ freq: 780, endFreq: 360, duration: 0.14, type: "square", gain: 0.022, delay: 0.04 });
  }

  function levelComplete() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      playTone({ freq, duration: 0.12, type: "triangle", gain: 0.042, delay: index * 0.09 });
    });
  }

  function gameFail() {
    [392, 330, 262].forEach((freq, index) => {
      playTone({ freq, endFreq: freq * 0.82, duration: 0.18, type: "sawtooth", gain: 0.035, delay: index * 0.12 });
    });
  }

  function tool() {
    playTone({ freq: 440, endFreq: 620, duration: 0.1, type: "triangle", gain: 0.03 });
  }

  return {
    pigRun,
    pigImpact,
    levelComplete,
    gameFail,
    tool,
  };
}

window.PigRun.audio = {
  createSoundManager,
};
})();
