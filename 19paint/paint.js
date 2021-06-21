import {
  elt,
  drawPicture,
  SCALE,
  pointerPosition,
  draw,
  rectangle,
  circle,
  fill,
  pick,
  line,
  historyUpdateState,
} from "./util.js";

import {
  ToolSelect,
  ColorSelect,
  SaveButton,
  LoadButton,
  UndoButton,
} from "./tools.js";

export class Picture {
  constructor(width, height, pixels) {
    this.width = width;
    this.height = height;
    // 数组表示像素的网格，每一格代表一像素，值对应这个像素的颜色。
    this.pixels = pixels;
  }
  // 创建新的像素网格
  static empty(width, height, color) {
    const pixels = new Array(width * height).fill(color);
    return new Picture(width, height, pixels);
  }
  // 返回指定格子的颜色
  pixel(x, y) {
    return this.pixels[x + y * this.width];
  }
  // 根据drawns数组更新像素网格
  draw(drawns) {
    const copy = this.pixels.slice();
    for (const { x, y, color } of drawns) {
      copy[x + y * this.width] = color;
    }
    return new Picture(this.width, this.height, copy);
  }
}

export class PictureCanvas {
  constructor(picture, onDown) {
    // 创建canvas元素，并且绑定鼠标事件和触摸事件
    this.dom = elt("canvas", {
      onmousedown: (event) => this.mouse(event, onDown),
      ontouchstart: (event) => this.touch(event, onDown),
    });
    // 初始化图片
    this.syncState(picture);
  }
  // 同步图片的状态
  syncState(picture) {
    if (this.picture === picture) return;
    // 把图片绘制在canvas上
    drawPicture(picture, this.dom, SCALE, this.picture);
    this.picture = picture;
  }
  // 监听鼠标左键
  mouse(event, onDown) {
    // 非鼠标左键，直接返回
    if (event.button !== 0) return;
    // 获取坐标
    let pos = pointerPosition(event, this.dom);

    // 返回一个新函数，鼠标移动时对图片进行修改
    let onMove = onDown(pos);
    // 函数不存在，直接返回
    if (!onMove) return;

    // 处理move事件
    const move = (e) => {
      // 没有键被按下，移除mousemove事件监听
      if (e.buttons === 0) {
        this.dom.removeEventListener("mousemove", move);
      } else {
        // 计算新位置
        const newPos = pointerPosition(e, this.dom);
        // 如果新位置与原位置一致，说明未移动，直接返回
        if (newPos.x === pos.x && newPos.y === pos.y) return;
        // 发生移动，记录新位置
        pos = newPos;
        // 对图片进行处理
        onMove(newPos);
      }
    };
    this.dom.addEventListener("mousemove", move);
  }
  // 监听触摸事件
  touch(event, onDown) {
    // 阻止默认行为，防止平移
    event.preventDefault();
    // 获取坐标
    let pos = pointerPosition(event, this.dom);
    // 返回一个新函数，鼠标移动时对图片进行修改
    let onMove = onDown(pos);
    // 函数不存在，直接返回
    if (!onMove) return;

    // 处理move事件
    const move = (e) => {
      // 计算新位置
      const newPos = pointerPosition(e.touches[0], this.dom);
      // 如果新位置与原位置一致，说明未移动，直接返回
      if (newPos.x === pos.x && newPos.y === pos.y) return;
      // 发生移动，记录新位置
      pos = newPos;
      // 对图片进行处理
      onMove(newPos);
    };
    // clear effect
    let end = () => {
      this.dom.removeEventListener("touchmove", move);
      this.dom.removeEventListener("touchend", end);
    };
    // touchmove发生时，对图片进行处理
    this.dom.addEventListener("touchmove", move);
    // touchend发生时，进行清理
    this.dom.addEventListener("touchend", end);
  }
}

// 工具管理
export class PixelEditor {
  constructor(state, config) {
    // 读取配置
    const { tools, controls, dispatch } = config;
    // 初始化状态
    this.state = state;
    // 初始化Canvas
    this.canvas = new PictureCanvas(state.picture, (pos) => {
      // 工具映射
      const tool = tools[this.state.tool];
      // 工具函数
      const onMove = tool(pos, this.state, dispatch);
      // 如果tool函数返回一个新函数，用于图片处理
      if (onMove) return (pos) => onMove(pos, this.state);
    });
    // 初始化控制工具
    this.controls = controls.map((Control) => new Control(state, config));
    // 构建DOM
    this.dom = elt(
      "div",
      {
        // 允许聚焦
        tabIndex: 0,
        // 监听键盘事件
        onkeydown: (e) => this.keyDown(e, config),
      },
      // ...children
      this.canvas.dom,
      elt("br"),
      ...this.controls.reduce((prev, next) => prev.concat(" ", next.dom), [])
    );
  }
  keyDown(e, { tools, dispatch }) {
    // 回退 ctrl + z / command + z
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      dispatch({ undo: true });
      // 切换工具，匹配工具首字母
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      for (const tool of Object.keys(tools)) {
        if (tool[0] === e.key) {
          e.preventDefault();
          dispatch({ tool });
          return;
        }
      }
    } else {
    }
  }
  syncState(state) {
    this.state = state;
    // 更新Canvas
    this.canvas.syncState(state.picture);
    // 更新控制工具
    this.controls.forEach((ctrl) => ctrl.syncState(state));
  }
}

const baseState = {
  tool: "draw",
  color: "#000000",
  picture: Picture.empty(600, 300, "#f0f0f0"),
  done: [],
  doneAt: 0,
};

const baseTools = { draw, fill, rectangle, circle, pick, line };

const baseControls = [
  ToolSelect,
  ColorSelect,
  SaveButton,
  LoadButton,
  UndoButton,
];

function startPixelEditor({ state, tools, controls }) {
  const app = new PixelEditor(state, {
    tools,
    controls,
    dispatch(action) {
      state = historyUpdateState(state, action);
      app.syncState(state);
    },
  });
  return app.dom;
}

// mount to DOM
document.getElementById("app").appendChild(
  startPixelEditor({
    state: baseState,
    tools: baseTools,
    controls: baseControls,
  })
);
