import { Picture } from "./paint.js";

// 构建DOM
export function elt(type, props, ...children) {
  // 创建对应类型的DOM元素
  let dom = document.createElement(type);
  // 复制属性到DOM元素
  if (props) Object.assign(dom, props);
  // 添加children到这个创建的DOM元素里
  for (const child of children) {
    if (typeof child !== "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

// 在canvas上绘制图片
export function drawPicture(picture, canvas, scale, prevPicture) {
  if (
    !prevPicture ||
    prevPicture.width !== picture.width ||
    prevPicture.height !== picture.height
  ) {
    canvas.width = picture.width;
    canvas.height = picture.height;
  }
  const cx = canvas.getContext("2d");
  for (let y = 0; y < picture.height; y++) {
    for (let x = 0; x < picture.width; x++) {
      // 填充每一个格子的像素
      let color = picture.pixel(x, y);
      // 这里使用了short circuit，prevPicture存在才会去比较像素的颜色
      if (!prevPicture || prevPicture.pixel(x, y) !== color) {
        cx.fillStyle = color;
        cx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

export const SCALE = 10;

// 事件坐标
export function pointerPosition(pos, domNode) {
  const rect = domNode.getBoundingClientRect();
  // clientX是视口内的坐标，rect.left是容器左边的距离
  // 差值为容器内的相对坐标
  return {
    x: Math.floor((pos.clientX - rect.left) / SCALE),
    y: Math.floor((pos.clientY - rect.top) / SCALE),
  };
}

// 像素绘制函数
// export function draw(pos, state, dispatch) {
//   function drawPixel({ x, y }, state) {
//     const drawn = { x, y, color: state.color };
//     // dispatch绘制像素的actions
//     dispatch({ picture: state.picture.draw([drawn]) });
//   }
//   drawPixel(pos, state);
//   // 返回绘制函数，用于下一次绘制
//   return drawPixel;
// }

export function draw(pos, state, dispatch) {
  function connect(newPos, state) {
    let line = drawLine(pos, newPos, state.color);
    pos = newPos;
    dispatch({ picture: state.picture.draw(line) });
  }
  connect(pos, state);
  return connect;
}

function drawLine(from, to, color) {
  let points = [];
  // 横向移动比纵向移动多
  if (Math.abs(from.x - to.x) > Math.abs(from.y - to.y)) {
    // 如果起点在终点右侧，交换起点和终点
    if (from.x > to.x) [from, to] = [to, from];
    // 计算正切值
    let slope = (to.y - from.y) / (to.x - from.x);
    for (let { x, y } = from; x <= to.x; x++) {
      // 从起点开始，x+1，y+slope
      points.push({ x, y: Math.round(y), color });
      y += slope;
    }
  // 横向移动比纵向移动少
  } else {
    // 如果起点在终点上方，交换起点和终点
    if (from.y > to.y) [from, to] = [to, from];
    // 计算余切值
    let slope = (to.x - from.x) / (to.y - from.y);
    for (let { x, y } = from; y <= to.y; y++) {
      // 从起点开始，y+1，x+slope
      points.push({ x: Math.round(x), y, color });
      x += slope;
    }
  }
  return points;
}

export function line(pos, state, dispatch) {
  return (newPos) => {
    let line = drawLine(pos, newPos, state.color);
    dispatch({ picture: state.picture.draw(line) });
  };
}

// 长方形绘制函数
export function rectangle(start, state, dispatch) {
  function drawRectangle(pos) {
    // 选取长方形左上角的坐标和右下角的坐标
    const xStart = Math.min(start.x, pos.x);
    const yStart = Math.min(start.y, pos.y);
    const xEnd = Math.max(start.x, pos.x);
    const yEnd = Math.max(start.y, pos.y);
    const drawn = [];
    // 填充长方形内的每一个像素
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        drawn.push({ x, y, color: state.color });
      }
    }
    // dispatch绘制像素的actions
    dispatch({ picture: state.picture.draw(drawn) });
  }
  // 返回绘制函数，用于下一次绘制
  // start, state, dispatch会存在闭包中
  return drawRectangle;
}

// 圆形绘制函数
export function circle(start, state, dispatch) {
  function drawCircle(pos) {
    // 选取圆形中心和半径
    let xStart = start.x;
    let yStart = start.y;
    let xEnd = pos.x;
    let yEnd = pos.y;
    const r = Math.ceil(
      Math.sqrt(
        (xStart - xEnd) * (xStart - xEnd) + (yStart - yEnd) * (yStart - yEnd)
      )
    );
    const drawn = [];
    // 填充圆形内的每一个像素
    for (let y = yStart - r; y <= yStart + r; y++) {
      for (let x = xStart - r; x <= xStart + r; x++) {
        // 跳过边界外的点
        if (
          x < 0 ||
          x > state.picture.width ||
          y < 0 ||
          y > state.picture.height
        )
          continue;
        // 保持在圆内
        if ((x - xStart) * (x - xStart) + (y - yStart) * (y - yStart) < r * r) {
          drawn.push({ x, y, color: state.color });
        }
      }
    }
    // dispatch绘制像素的actions
    dispatch({ picture: state.picture.draw(drawn) });
  }
  // 返回绘制函数，用于下一次绘制
  // start, state, dispatch会存在闭包中
  return drawCircle;
}

const AROUND = [
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
];

/* 
填充函数

目前这个算法效率比较低，稍微大一点的区域就要算很久，还会卡死
*/
export function fill({ x, y }, state, dispatch) {
  let count = 0;
  // 目标位置的颜色
  const targetColor = state.picture.pixel(x, y);
  // 把目标位置加入drawn，表示要绘制的像素
  const drawn = [{ x, y, color: state.color }];
  for (let done = 0; done < drawn.length; done++) {
    for (let { dx, dy } of AROUND) {
      if (count > 10000) {
        alert("计算边界失败");
        throw new Error("计算边界失败");
      }
      // 相邻点
      let x = drawn[done].x + dx,
        y = drawn[done].y + dy;
      if (
        // x, y在边界内
        x >= 0 &&
        x < state.picture.width &&
        y >= 0 &&
        y < state.picture.height &&
        // x, y 的颜色和目标位置的颜色一样
        state.picture.pixel(x, y) === targetColor &&
        // drawn中还没有这个x, y
        !drawn.some((p) => p.x === x && p.y === y)
      ) {
        // 加入drawn中，由于drawn的length变长了，又会接着遍历，直到找到区域内的所有点
        drawn.push({ x, y, color: state.color });
        count++;
      }
    }
  }
  // dispatch绘制像素的actions
  dispatch({ picture: state.picture.draw(drawn) });
}

// 选取颜色
export function pick(pos, state, dispatch) {
  dispatch({ color: state.picture.pixel(pos.x, pos.y) });
}

// 加载文件
export function startLoad(dispatch) {
  const input = elt("input", {
    type: "file",
    onchange: () => finishLoad(input.files[0], dispatch),
  });
  input.click();
  input.remove();
}

// 读取文件并处理
function finishLoad(file, dispatch) {
  if (file === null) return;
  readImageURL(file)
    .then((url) => loadImage(url))
    .then((image) => {
      dispatch({
        picture: pictureFromImage(image),
      });
    })
    .catch((e) => {
      console.error(e);
    });
}

// 使用FileReader读取图片的url
function readImageURL(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

// 异步加载图片
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// 图片转换成Picture对象
function pictureFromImage(image) {
  const pixels = [];

  // 最多100*100
  const width = Math.min(100, image.width);
  const height = Math.min(100, image.height);
  // 先将图片绘制到canvas上，然后取出里面的像素
  const canvas = elt("canvas", {
    width,
    height,
  });
  const cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);

  // data是一个0-255的数构成的数组，表示rgba
  const { data } = cx.getImageData(0, 0, width, height);

  // 将数字转换成十六进制，前面补零
  function hex(n) {
    return n.toString(16).padStart(2, "0");
  }

  // 每四位表示r g b a
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = data.slice(i, i + 3);
    pixels.push("#" + hex(r) + hex(g) + hex(b));
  }

  return new Picture(width, height, pixels);
}

// Before：简单的更新
export function updateState(state, action) {
  return Object.assign({}, state, action);
}

// After：复杂更新操作，支持回滚
export function historyUpdateState(state, action) {
  // 撤回操作
  if (action.undo) {
    // 当前没有版本，返回当前状态
    if (state.done.length === 0) return state;
    // 返回done中第一个版本，并且重置doneAt
    return Object.assign({}, state, {
      picture: state.done[0],
      done: state.done.slice(1),
      doneAt: 0,
    });
    // 时间间隔大于1秒，保存图片版本
  } else if (action.picture && state.doneAt < Date.now() - 1000) {
    return Object.assign({}, state, action, {
      done: [state.picture, ...state.done],
      doneAt: Date.now(),
    });
  } else {
    // 简单的合并状态并返回
    return Object.assign({}, state, action);
  }
}
