import {
  elt,
  drawPicture,
  startLoad,
} from "./util.js";


export class ToolSelect {
  constructor(state, { tools, dispatch }) {
    // 工具下拉框
    this.select = elt(
      "select",
      {
        // 切换工具时dispatch actions
        onchange: () => dispatch({ tool: this.select.value }),
      },
      ...Object.keys(tools).map((name) =>
        elt(
          "option",
          {
            // name与状态中的工具名称一致，表示选中
            selected: name === state.tool,
          },
          name
        )
      )
    );
    this.dom = elt("label", null, "🖌 Tool: ", this.select);
  }
  // 更新状态
  syncState(state) {
    this.select.value = state.tool;
  }
}

export class ColorSelect {
  constructor(state, { dispatch }) {
    this.input = elt("input", {
      type: "color",
      value: state.color,
      // 切换颜色时dispatch actions
      onchange: () => dispatch({ color: this.input.value }),
    });
    this.dom = elt("label", null, "🎨 Color: ", this.input);
  }
  // 更新状态
  syncState(state) {
    this.input.value = state.color;
  }
}

export class SaveButton {
  constructor(state) {
    this.picture = state.picture;
    this.dom = elt(
      "button",
      {
        onclick: () => this.save(),
      },
      "💾 Save"
    );
  }
  save() {
    // 重新创建了一个canvas，并且将图片按照1：1的比例绘制在canvas上面
    let canvas = elt("canvas"),
      scale = 1;
    drawPicture(this.picture, canvas, scale);
    // 创建a标签，用于下载图片
    const link = elt("a", {
      href: canvas.toDataURL(),
      download: "pixelart.png",
    });
    link.click();
    link.remove();
  }
  // 更新状态
  syncState(state) {
    this.picture = state.picture;
  }
}

export class LoadButton {
  constructor(_, { dispatch }) {
    this.dom = elt(
      "button",
      {
        onclick: () => startLoad(dispatch),
      },
      "📁 Load"
    );
  }
  syncState() {}
}

export class UndoButton {
  constructor(state, { dispatch }) {
    this.dom = elt(
      "button",
      {
        onclick: () => dispatch({ undo: true }),
        disabled: state.done.length === 0,
      },
      "⮪ Undo"
    );
  }
  syncState(state) {
    this.dom.disabled = state.done.length === 0;
  }
}