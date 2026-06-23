# 小猪快跑 GPT 检查说明

这是一个纯静态 HTML/CSS/JS 手机竖屏小游戏，可直接打开 `index.html`，也可通过任意静态服务器预览。

## 需要重点检查

1. 玩法逻辑
   - 点击小猪，如果前方一路无阻，小猪应跑出屏幕。
   - 如果前方被挡，小猪应向前移动到可达的最后位置，撞击、冒旋转星星、短暂晕眩。
   - 小猪按 2 x 1 身体占位，移动和阻挡都应考虑头格和身体格。
   - 洗牌不能洗出同一行或同一列中两只小猪面对面的死结。
   - 洗牌不能洗出 2 x 1 身体重叠或身体越界。
   - 内置关卡也不应存在这种面对面死结。
   - 关卡不应过于无脑，至少第 2、3 关需要观察方向和阻挡关系，不应只是一路乱点。

2. 视觉表现
   - 小猪贴图方向应自然：右、左、上、下不应有明显透视错误。
   - 跑动应有弹跳、烟雾和轻微身体变化，不应像平移漂移。
   - 竖屏布局中按钮、棋盘、提示文字不应重叠。
   - 手机微信内置浏览器中，小猪图片应能正常显示。
   - 展示用小猪 PNG 应保持较小体积，同时不能出现明显糊、色带或透明边异常。
   - 页面不需要支持双指缩放或双击放大。
   - 手机上触摸小猪应可靠，但不能宽容到误点相邻小猪。
   - 手机微信中不应明显卡顿；canvas 像素倍率有上限，背景/棋盘应避免每帧重复重画，粒子数量应受控。

3. 后续扩展
   - 关卡数据在 `src/levels.js`。
   - 关卡格式说明在 `docs/level-format.md`。
   - 配置在 `src/config.js`。
   - 音效管理在 `src/audio.js`，后续可替换为真实音频文件。

## 快速检查命令

```bash
node --check game.js
node --check src/config.js
node --check src/levels.js
node --check src/assets.js
node --check src/audio.js
```

关卡死结校验：

```bash
node - <<'NODE'
const fs = require('fs');
const vm = require('vm');
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/levels.js', 'utf8'), context);
const { list, validateLevel } = context.window.PigRun.levels;
let failed = false;
for (const level of list) {
  const issues = validateLevel(level);
  console.log(`${level.id}: ${issues.length ? JSON.stringify(issues) : 'ok'}`);
  if (issues.length) failed = true;
}
process.exit(failed ? 1 : 0);
NODE
```

## 已发布地址

https://songyiting2019-art.github.io/pigrun/
