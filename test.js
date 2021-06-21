function printN(n) {
  const char = "#";
  const s = Array(n).fill(char).join(""); // or char.repeat(n)
  console.log(s);
}

function testPrintN() {
  let n = 7;
  for (let i = 1; i <= n; i++) {
    printN(i);
  }
}

function fizzbuzz() {
  for (let i = 1; i <= 20; i++) {
    if (i % 15 == 0) console.log("FizzBuzz");
    else if (i % 3 == 0) console.log("Fizz");
    else if (i % 5 == 0) console.log("Buzz");
    else console.log(i);
  }
}

function chessboard(n) {
  const space = " ";
  const hash = "#";
  for (let i = 0; i < n; i++) {
    let s = "";
    for (let j = 0; j < n; j++) {
      // the odd start with space
      if ((i + j) % 2 === 0) {
        s += space;
      } else {
        s += hash;
      }
    }
    console.log(s);
  }
}

function findSolution(target) {
  function find(current, history) {
    if (current == target) {
      return history;
    } else if (current > target) {
      return null;
    } else {
      return (
        find(current + 5, `(${history} + 5)`) ||
        find(current * 3, `(${history} * 3)`)
      );
    }
  }
  return find(1, "1");
}

function min(a, b) {
  return a - b >= 0 ? b : a;
}

function testMathMin() {
  console.log(min(0, 10));
  // → 0
  console.log(min(0, -10));
  // → -10
}

function isEven(n) {
  if (n < 0) return isEven(-n);
  if (n === 0) return true;
  if (n === 1) return false;
  return isEven(n - 2);
}

function testIsEven() {
  console.log(isEven(50));
  // → true
  console.log(isEven(75));
  // → false
  console.log(isEven(-1));
  // → ??
}

function countBs(str) {
  const char = "B";
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const cur = str[i];
    if (cur === char) count++;
  }
  return count;
}

function countChar(str, char) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const cur = str[i];
    if (cur === char) count++;
  }
  return count;
}

function testCountBs() {
  console.log(countBs("BBC"));
  // → 2
  console.log(countChar("kakkerlak", "k"));
  // → 4
}

function range(start, end, step) {
  const arr = [];
  if (start <= end) {
    step = step || 1;
    while (start <= end) {
      arr.push(start);
      start += step;
    }
  } else {
    step = step || -1;
    while (start >= end) {
      arr.push(start);
      start += step;
    }
  }
  return arr;
}

function testRange() {
  console.log(range(1, 10));
  // → [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  console.log(range(5, 2, -2));
  // → [5, 4, 3, 2]
}

function sum(nums) {
  let final = 0;
  for (const num of nums) {
    final += num;
  }
  return final;
}

function testSumAndRange() {
  console.log(sum(range(1, 10)));
  // → 55
}

function reverseArray(arr) {
  const newarr = [];

  for (let i = arr.length - 1; i >= 0; i--) {
    newarr.push(arr[i]);
  }

  return newarr;
}

function testReverseArray() {
  console.log(reverseArray(["A", "B", "C"]));
  // → ["C", "B", "A"];
}

function reverseArrayInPlace(arr) {
  let start = 0,
    end = arr.length - 1;
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;

    start++;
    end--;
  }
  return arr;
}

function testReverseArrayInPlace() {
  let arrayValue = [1, 2, 3, 4, 5];
  reverseArrayInPlace(arrayValue);
  console.log(arrayValue);
  // → [5, 4, 3, 2, 1]
}

function arrayToList(arr) {
  let list = null;

  for (let i = arr.length - 1; i >= 0; i--) {
    list = {
      value: arr[i],
      // 引用前一个list
      rest: list,
    };
  }

  return list;
}

function testArrayToList() {
  const list = arrayToList([10, 20, 30, 40, 50]);
  console.log(JSON.stringify(list));
  // → {value: 10, rest: {value: 20, rest: null}}
}

function listToArray(list) {
  const arr = [];
  for (let node = list; node; node = node.rest) {
    arr.push(node.value);
  }
  return arr;
}

function testListToArray() {
  console.log(listToArray(arrayToList([10, 20, 30])));
  // → [10, 20, 30]
}

function prepend(el, list) {
  const newlist = {
    value: el,
    rest: list,
  };
  return newlist;
}

function testPrepend() {
  console.log(prepend(10, prepend(20, null)));
  // → {value: 10, rest: {value: 20, rest: null}}
}

function nth(list, index) {
  let cur = 0;
  for (let node = list; node; node = node.rest) {
    if (cur === index) return node.value;
    cur++;
  }
  return null;
}

function testNth() {
  console.log(nth(arrayToList([10, 20, 30]), 0));
  // → 20
}

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 == "object" &&
    obj1 !== null &&
    typeof obj2 == "object" &&
    obj2 !== null
  ) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!obj2.hasOwnProperty(key)) {
        return false;
      } else {
        if (!deepEqual(obj1[key], obj2[key])) return false;
      }
    }

    return true;
  }

  return false;
}

function testDeepEqual() {
  let obj = { here: { is: "an" }, object: 2 };
  console.log(deepEqual(obj, obj));
  // → true
  console.log(deepEqual(obj, { here: 1, object: 2 }));
  // → false
  console.log(deepEqual(obj, { here: { is: "an" }, object: 2 }));
  // → true
}

// testDeepEqual();

function testEmoji() {
  // Two emoji characters, horse and shoe
  let horseShoe = "🐴👟";
  console.log(horseShoe.length);
  // → 4
  console.log(horseShoe[0]);
  // → (Invalid half-character)
  console.log(horseShoe.charCodeAt(0));
  // → 55357 (Code of the half-character)
  console.log(horseShoe.codePointAt(0));
  // → 128052 (Actual code for horse emoji)
}

// testEmoji();

function flatten(arrs) {
  const arr = arrs.reduce((prev, next) => {
    return prev.concat(next);
  });
  return arr;
}

function testFlatten() {
  let arrays = [[1, 2, 3], [4, 5], [6]];
  // Your code here.
  console.log(flatten(arrays));
  // → [1, 2, 3, 4, 5, 6]
}

// testFlatten();

function loop(value, test, update, body) {
  while (test(value)) {
    body(value);
    value = update(value);
  }
}

function testLoop() {
  loop(
    3,
    (n) => n > 0,
    (n) => n - 1,
    console.log
  );
  // → 3
  // → 2
  // → 1
}

// testLoop();

function every(array, test) {
  for (const item of array) {
    if (!test(item)) return false;
  }
  return true;
}

function testEvery() {
  console.log(every([1, 3, 5], (n) => n < 10));
  // → true
  console.log(every([2, 4, 16], (n) => n < 10));
  // → false
  console.log(every([], (n) => n < 10));
  // → true
}

// testEvery();

import SCRIPTS from "./scripts.js";

function characterScript(code) {
  for (let script of SCRIPTS) {
    if (script.ranges.some(([from, to]) => code >= from && code < to)) {
      return script;
    }
  }
  return null;
}

function countBy(items, groupName) {
  let counts = [];
  for (let item of items) {
    let name = groupName(item);
    let known = counts.findIndex((c) => c.name == name);
    if (known == -1) {
      counts.push({ name, count: 1 });
    } else {
      counts[known].count++;
    }
  }
  return counts;
}

function dominantDirection(text) {
  let scripts = countBy(text, (char) => {
    let script = characterScript(char.codePointAt(0));
    return script ? script.direction : "none";
  }).filter(({ name }) => name != "none");
  switch (scripts.length) {
    case 0:
      return "no dominant direction found";
    case 1:
      return scripts[0].name;
    default:
      if (scripts.reduce((acc, cur) => acc.count === cur.count)) {
        return "no dominant direction found";
      } else {
        return scripts.reduce((acc, cur) =>
          acc.count >= cur.count ? acc.name : cur.name
        );
      }
  }
}

function testDominantDirection() {
  console.log(dominantDirection("Hello!"));
  // → ltr
  console.log(dominantDirection("Hey, مساء الخير"));
  // → rtl
}

// testDominantDirection();

class Vec {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vec) {
    return new Vec(this.x + vec.x, this.y + vec.y);
  }

  minus(vec) {
    return new Vec(this.x - vec.x, this.y - vec.y);
  }

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

function testVec() {
  console.log(new Vec(1, 2).plus(new Vec(2, 3)));
  // → Vec{x: 3, y: 5}
  console.log(new Vec(1, 2).minus(new Vec(2, 3)));
  // → Vec{x: -1, y: -1}
  console.log(new Vec(3, 4).length);
  // → 5
}

// testVec();

class Group {
  constructor() {
    this.arr = [];
  }

  has(val) {
    return this.arr.indexOf(val) !== -1;
  }

  add(val) {
    if (!this.has(val)) {
      this.arr.push(val);
    }
  }

  delete(val) {
    return this.arr.filter((item) => item !== val);
  }

  static from(vals) {
    const g = new Group();
    for (const val of vals) {
      g.add(val);
    }
    return g;
  }

  [Symbol.iterator]() {
    return new GroupIterator(this);
  }
}

class GroupIterator {
  constructor(group) {
    this.idx = 0;
    this.arr = group.arr;
  }

  next() {
    if (this.idx === this.arr.length) return { done: true };

    return {
      value: this.arr[this.idx++],
      done: false,
    };
  }
}

function testGroup() {
  let group = Group.from([10, 20]);
  console.log(group.has(10));
  // → true
  console.log(group.has(30));
  // → false
  group.add(10);
  group.delete(10);
  console.log(group.has(10));
  // → false

  for (let value of Group.from(["a", "b", "c"])) {
    console.log(value);
  }
  // → a
  // → b
  // → c
}

// testGroup();

function testHasOwnProperty() {
  let map = { one: true, two: true, hasOwnProperty: true };

  // Fix this call
  // console.log(map.hasOwnProperty("one"));
  console.log(Object.hasOwnProperty.call(map, "one"));
  // → true
}

// testHasOwnProperty();

class PGroup {
  constructor(arr = []) {
    this.arr = arr;
  }

  has(val) {
    return this.arr.indexOf(val) !== -1;
  }

  add(val) {
    if (!this.has(val)) {
      return new PGroup(this.arr.concat([val]));
    }
    return this;
  }

  delete(val) {
    if (!this.has(val)) {
      return this;
    }
    return new PGroup(this.arr.filter((item) => item !== val));
  }

  static empty = new PGroup([]);
}

function testPGroup() {
  let a = PGroup.empty.add("a");
  let ab = a.add("b");
  let b = ab.delete("a");

  console.log(b.has("b"));
  // → true
  console.log(a.has("b"));
  // → false
  console.log(b.has("a"));
  // → false
}

// testPGroup();

/* S8 Error */

class MultiplicatorUnitFailure extends Error {}

function primitiveMultiply(a, b) {
  if (Math.random() < 0.2) {
    return a * b;
  } else {
    throw new MultiplicatorUnitFailure("Klunk");
  }
}

function reliableMultiply(a, b) {
  try {
    return primitiveMultiply(a, b);
  } catch (error) {
    if (error instanceof MultiplicatorUnitFailure) {
      return reliableMultiply(a, b);
    }
    throw error;
  }
}

function testReliableMultiply() {
  console.log(reliableMultiply(8, 8));
  // → 64
}

// testReliableMultiply();

const box = {
  locked: true,
  unlock() {
    this.locked = false;
  },
  lock() {
    this.locked = true;
  },
  _content: [],
  get content() {
    if (this.locked) throw new Error("Locked!");
    return this._content;
  },
};

function withBoxUnlocked(body) {
  // 箱子初始状态
  const locked = box.locked;

  // 箱子未锁
  if (!locked) {
    return body();
  }

  // 箱子锁了
  try {
    if (locked) {
      box.unlock();
      body();
    }
  } catch (error) {
    console.log("Error raised: " + error);
  } finally {
    box.lock();
  }
}

function testWithBoxUnlocked(params) {
  withBoxUnlocked(function () {
    box.content.push("gold piece");
  });

  withBoxUnlocked(function () {
    throw new Error("Pirates on the horizon! Abort!");
  });

  console.log(box.locked);
  // → true
}

// testWithBoxUnlocked();

/* S9 Regular Expressions */

function verify(regexp, yes, no) {
  // Ignore unfinished exercises
  if (regexp.source == "...") return;
  for (let str of yes) {
    if (!regexp.test(str)) {
      console.log(`Failure to match '${str}'`);
    }
  }
  for (let str of no) {
    if (regexp.test(str)) {
      console.log(`Unexpected match for '${str}'`);
    }
  }
}

function testVerify(params) {
  // Fill in the regular expressions

  verify(/ca[rt]/, ["my car", "bad cats"], ["camper", "high art"]);

  verify(/pr?op/, ["pop culture", "mad props"], ["plop", "prrrop"]);

  verify(
    /ferr(et|y|ari)/,
    ["ferret", "ferry", "ferrari"],
    ["ferrum", "transfer A"]
  );

  verify(
    /ious\b/,
    ["how delicious", "spacious room"],
    ["ruinous", "consciousness"]
  );

  verify(/\s[.,:;]/, ["bad punctuation ."], ["escape the period"]);

  verify(
    /\w{6,}/,
    ["Siebentausenddreihundertzweiundzwanzig"],
    ["no", "three small words"]
  );

  verify(
    /\b[^\We]+\b/i,
    ["red platypus", "wobbling nest"],
    ["earth bed", "learning ape", "BEET"]
  );
}

// testVerify();

function testQuotingReplace() {
  let text = "'I'm the cook,' he said, 'it's my job.'";
  // Change this call.
  console.log(text.replace(/(^|\W)'|'(\W|$)/g, '$1"$2'));
  // → "I'm the cook," he said, "it's my job."
}

// testQuotingReplace();

function testNumber() {
  let number = /^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i;

  // Tests:
  for (let str of [
    "1",
    "-1",
    "+15",
    "1.55",
    ".5",
    "5.",
    "1.3e2",
    "1E-4",
    "1e+12",
  ]) {
    if (!number.test(str)) {
      console.log(`Failed to match '${str}'`);
    }
  }
  for (let str of ["1a", "+-1", "1.2.3", "1+1", "1e4.5", ".5.", "1f5", "."]) {
    if (number.test(str)) {
      console.log(`Incorrectly accepted '${str}'`);
    }
  }
}

// testNumber();

/* S14 DOM */
import { JSDOM } from "jsdom";
const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;

function testTableForMoutains() {
  const MOUNTAINS = [
    { name: "Kilimanjaro", height: 5895, place: "Tanzania" },
    { name: "Everest", height: 8848, place: "Nepal" },
    { name: "Mount Fuji", height: 3776, place: "Japan" },
    { name: "Vaalserberg", height: 323, place: "Netherlands" },
    { name: "Denali", height: 6168, place: "United States" },
    { name: "Popocatepetl", height: 5465, place: "Mexico" },
    { name: "Mont Blanc", height: 4808, place: "Italy/France" },
  ];

  const moutainEl = document.createElement("div");
  moutainEl.setAttribute("id", "mountains");

  const tableEl = document.createElement("table");

  // 创建表头
  const first = MOUNTAINS[0];
  const trEl = document.createElement("tr");
  const columnNames = Object.keys(first);

  for (const columnName of columnNames) {
    const thEl = document.createElement("th");
    thEl.innerHTML = columnName;
    trEl.appendChild(thEl);
  }
  tableEl.appendChild(trEl);

  // 创建body
  for (const item of MOUNTAINS) {
    const trEl = document.createElement("tr");

    for (const columnName of columnNames) {
      const tdEl = document.createElement("td");
      tdEl.innerHTML = item[columnName];

      if (typeof item[columnName] === "number") {
        tdEl.style.textAlign = "right";
      }
      trEl.appendChild(tdEl);
    }

    tableEl.appendChild(trEl);
  }

  console.log(tableEl.innerHTML);
}

// testTableForMoutains();

function byTagName(node, tagName) {
  const found = [];
  tagName = tagName.toUpperCase();

  function explore(node) {
    for (const child of node.childNodes) {
      if (child.nodeType == document.ELEMENT_NODE) {
        if (child.nodeName == tagName) found.push(child);
        explore(child);
      }
    }
  }

  explore(node);
  return found;
}

function testByTagName() {
  document.body.innerHTML = `<h1>Heading with a <span>span</span> element.</h1>
  <p>A paragraph with <span>one</span>, <span>two</span>
    spans.</p>`;
  console.log(byTagName(document.body, "h1").length);
  // → 1
  console.log(byTagName(document.body, "span").length);
  // → 3
  let para = document.querySelector("p");
  console.log(byTagName(para, "span").length);
}

// testByTagName();

function testAnimate() {
  // 浏览器中测试

  /* 
  <style>body { min-height: 200px }</style>
<img src="img/cat.png" id="cat" style="position: absolute">
<img src="img/hat.png" id="hat" style="position: absolute">
  */
  let cat = document.querySelector("#cat");
  let hat = document.querySelector("#hat");

  let angle = 0;
  let lastTime = null;
  function animate(time) {
    if (lastTime != null) angle += (time - lastTime) * 0.001;
    lastTime = time;
    cat.style.top = Math.sin(angle) * 40 + 40 + "px";
    cat.style.left = Math.cos(angle) * 200 + 230 + "px";

    // Your extensions here.
    hat.style.top = Math.sin(angle + Math.PI) * 40 + 40 + "px";
    hat.style.left = Math.cos(angle + Math.PI) * 200 + 230 + "px";
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// testAnimate();

/* S15 Event */

function testBallon() {
  // 浏览器中测试

  /* 
  <p id="Balloon">🎈</p>
  */
  const handleKeyUp = (e) => {
    const el = document.getElementById("Balloon");
    if (e.key === "ArrowUp") {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      el.style.fontSize = fontSize + 10 + "px";

      if (fontSize + 10 > 100) {
        el.textContent = "💥";
        window.removeEventListener("keydown", handleKeyUp);
      }
    }
    if (e.key === "ArrowDown") {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      if (fontSize > 10) {
        el.style.fontSize = fontSize - 10 + "px";
      }
    }
  };

  window.addEventListener("keydown", handleKeyUp);
}

function testTrail() {
  // 浏览器中测试

  /* 
    <style>
  .trail {
    position: absolute;
    height: 6px; width: 6px;
    border-radius: 3px;
    background: teal;
  }
  body {
    height: 300px;
  }
  </style>
  */

  const dots = [];
  let cur = 0;

  for (let i = 0; i < 12; i++) {
    const dot = document.createElement("div");
    dot.className = "trail";
    document.body.appendChild(dot);
    dots.push(dot);
  }

  const handleMouseMove = (e) => {
    const dot = dots[cur++ % dots.length];
    dot.style.left = e.pageX - 3 + "px";
    dot.style.top = e.pageY - 3 + "px";
  };
  window.addEventListener("mousemove", handleMouseMove);
}

function testTabPanel() {
  /* 
  <tab-panel>
  <div data-tabname="one">Tab one</div>
  <div data-tabname="two">Tab two</div>
  <div data-tabname="three">Tab three</div>
  </tab-panel>
  */

  function asTabs(node) {
    const panels = Array.from(node.querySelectorAll("div"));
    const tabs = panels.map((panel) => {
      const tabnme = panel.getAttribute("data-tabname");
      const button = document.createElement("button");
      button.id = tabnme;
      button.textContent = tabnme;
      // 绑定事件
      button.addEventListener("click", handleTabClick);
      return {
        panel,
        button,
      };
    });
    // 插入到最前面
    const tabDiv = document.createElement("div");
    for (const tab of tabs) {
    }
    for (let i = 0; i < tabs.length; i++) {
      const { button, panel } = tabs[i];
      tabDiv.appendChild(button);
      if (i === 0) {
        panel.style.display = "block";
        button.style.color = "red";
      } else {
        panel.style.display = "none";
        button.style.color = "";
      }
    }

    node.insertBefore(tabDiv, node.firstChild);

    function handleTabClick(e) {
      for (const { panel, button } of tabs) {
        // 按钮样式
        if (button.id === e.target.id) {
          button.style.color = "red";
        } else {
          button.style.color = "";
        }
        // panel显示
        if (panel.getAttribute("data-tabname") === e.target.id) {
          panel.style.display = "block";
        } else {
          panel.style.display = "none";
        }
      }
    }
  }

  asTabs(document.querySelector("tab-panel"));
}
