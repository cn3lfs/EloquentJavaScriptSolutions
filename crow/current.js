import { bigOak, defineRequestType, everywhere } from "./crow-tech.js";

// 先运行服务端，对请求类型进行注册。
import "./nest.js";
/* 
乌鸦读取存储
*/
function testReadStorage() {
  bigOak.readStorage("food caches", (caches) => {
    let firstCache = caches[0];
    bigOak.readStorage(firstCache, (info) => {
      console.log(info);
    });
  });
}

// promise版本的readStorage
export function storage(nest, name) {
  return new Promise((resolve) => {
    nest.readStorage(name, (result) => resolve(result));
  });
}

function testStorage(params) {
  storage(bigOak, "enemies").then((value) => console.log("Got", value));
}

// testStorage();

/* 
乌鸦发送消息 Request，并指定Response返回后的handler
*/
function testRequest() {
  bigOak.send("Cow Pasture", "note", "Let's caw loudly at 7PM", () =>
    console.log("Note delivered.")
  );
}

// testRequest();

/* 
Request Promise版本，失败自动重试，最多3次，否则报超时错误。
*/
class Timeout extends Error {}

export function request(nest, target, type, content) {
  return new Promise((resolve, reject) => {
    let done = false;
    function attempt(n) {
      nest.send(target, type, content, (failed, value) => {
        done = true;
        if (failed) reject(failed);
        else resolve(value);
      });
      setTimeout(() => {
        if (done) return;
        else if (n < 3) attempt(n + 1);
        else reject(new Timeout("Timed out"));
      }, 250);
    }
    attempt(1);
  });
}

export function availableNeighbors(nest) {
  // 可以ping的通的返回true，不能ping通的返回false
  let requests = nest.neighbors.map((neighbor) => {
    return request(nest, neighbor, "ping").then(
      () => true,
      () => false
    );
  });
  // result的index和neighbors的index是一致的，过滤掉ping不通的neighbors
  return Promise.all(requests).then((result) => {
    return nest.neighbors.filter((_, i) => result[i]);
  });
}

function testAvailableNeighbors() {
  availableNeighbors(bigOak).then(console.log);
}

// testAvailableNeighbors();

/* 
转发消息1：flooding
*/
export function sendGossip(nest, message, exceptFor = null) {
  nest.state.gossip.push(message);
  for (let neighbor of nest.neighbors) {
    if (neighbor == exceptFor) continue;
    request(nest, neighbor, "gossip", message);
  }
}

function testSendGossip() {
  everywhere((nest) => {
    nest.state.gossip = [];
  });

  sendGossip(bigOak, "Kids with airgun in the park");
}

// testSendGossip();

/* 
转发消息2：routing
*/
export function broadcastConnections(nest, name, exceptFor = null) {
  for (let neighbor of nest.neighbors) {
    if (neighbor == exceptFor) continue;
    request(nest, neighbor, "connections", {
      name,
      neighbors: nest.state.connections.get(name),
    });
  }
}

everywhere((nest) => {
  nest.state.connections = new Map();
  nest.state.connections.set(nest.name, nest.neighbors);
  broadcastConnections(nest, nest.name);
});

/* 
寻路
*/
function findRoute(from, to, connections) {
  let work = [{ at: from, via: null }];
  for (let i = 0; i < work.length; i++) {
    let { at, via } = work[i];
    for (let next of connections.get(at) || []) {
      // 如果当前connection就是要去的地方，直接返回方向
      if (next == to) return via;
      // 如果当前work中没有当前connection，加入work，继续查找。
      if (!work.some((w) => w.at == next)) {
        work.push({ at: next, via: via || next });
      }
    }
  }
  return null;
}

/* 
给远端节点发送消息
*/
export function routeRequest(nest, target, type, content) {
  // 如果当前节点可直接到达，用request传递消息
  if (nest.neighbors.includes(target)) {
    return request(nest, target, type, content);
  } else {
    // 查找下一个要经过的节点
    let via = findRoute(nest.name, target, nest.state.connections);
    if (!via) throw new Error(`No route to ${target}`);
    // 将消息转发给这个节点
    return request(nest, via, "route", { target, type, content });
  }
}

function testRouteRequest() {
  routeRequest(bigOak, "Church Tower", "note", "Incoming jackdaws!");
}

/* 
查找仓储
*/
function findInStorage(nest, name) {
  // 先在当前存储节点查找一遍
  return storage(nest, name).then((found) => {
    // 如果发现了，就直接返回
    if (found != null) return found;
    // 如果没有发现，就在远端节点上继续查找。
    else return findInRemoteStorage(nest, name);
  });
}

function network(nest) {
  return Array.from(nest.state.connections.keys());
}

function findInRemoteStorage(nest, name) {
  // 过滤掉当前节点
  let sources = network(nest).filter((n) => n != nest.name);
  // 下一个节点进行尝试
  function next() {
    if (sources.length == 0) {
      return Promise.reject(new Error("Not found"));
    } else {
      // 随机取一个节点
      let source = sources[Math.floor(Math.random() * sources.length)];
      // sources中去掉已经访问过的节点
      sources = sources.filter((n) => n != source);
      // 用routeRequest进行访问
      return routeRequest(nest, source, "storage", name).then(
        (value) => (value != null ? value : next()),
        next
      );
    }
  }
  return next();
}

// async 方式的findInStorage
async function findInStorage2(nest, name) {
  let local = await storage(nest, name);
  if (local != null) return local;

  let sources = network(nest).filter((n) => n != nest.name);
  while (sources.length > 0) {
    let source = sources[Math.floor(Math.random() * sources.length)];
    sources = sources.filter((n) => n != source);
    try {
      let found = await routeRequest(nest, source, "storage", name);
      if (found != null) return found;
    } catch (_) {}
  }
  throw new Error("Not found");
}

function testFindInStorage() {
  findInStorage(bigOak, "events on 2017-12-21").then(console.log, console.log);
}

// testFindInStorage();

/* 
访问仓储，同时支持相邻节点和远端节点
*/
function anyStorage(nest, source, name) {
  // 如果存储源和当前节点名字相同，则从当前节点存储获取
  if (source == nest.name) return storage(nest, name);
  // 否则存储源在远端节点，用routeRequest进行访问
  else return routeRequest(nest, source, "storage", name);
}

/* 
数小鸡
*/
async function chicks(nest, year) {
  let lines = network(nest).map(async (name) => {
    return name + ": " + (await anyStorage(nest, name, `chicks in ${year}`));
  });
  return (await Promise.all(lines)).join("\n");
}

function testChicks() {
  chicks(bigOak, 2017).then(console.log);
}

// testChicks();

/* S11 Asynchronous Programming */

async function locateScalpel(nest) {
  let current = nest.name;
  for (;;) {
    // 第一次因为source == nest.name，会在当前存储节点查找
    // 如果scalpel指向的目标位置不是当前位置，就会进入下一个循环
    let next = await anyStorage(nest, current, "scalpel");
    // 目标位置是当前位置，返回目标
    if (next == current) return current;
    current = next;
  }
}

function testLocateScalpel() {
  locateScalpel(bigOak).then(console.log);
  // → Butcher's Shop
}

// testLocateScalpel();

function locateScalpel2(nest) {
  function loop(current) {
    return anyStorage(nest, current, "scalpel").then((next) => {
      if (next == current) return current;
      else return loop(next);
    });
  }
  return loop(nest.name);
}

function testLocateScalpel2() {
  locateScalpel2(bigOak).then(console.log);
  // → Butcher's Shop
}

// testLocateScalpel2();

function Promise_all(promises) {
  return new Promise((resolve, reject) => {
    let len = promises.length,
      pending = len;
    const arr = new Array(len);
    if (len === 0) resolve(arr);

    for (let i = 0; i < len; i++) {
      const p = promises[i];
      Promise.resolve(p)
        .then((res) => {
          arr[i] = res;
          pending--;
          if (pending === 0) {
            resolve(arr);
          }
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}

function testPromise_all() {
  // Test code.
  Promise_all([]).then((array) => {
    console.log("This should be []:", array);
  });
  function soon(val) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(val), Math.random() * 500);
    });
  }
  Promise_all([soon(1), soon(2), soon(3)]).then((array) => {
    console.log("This should be [1, 2, 3]:", array);
  });
  Promise_all([soon(1), Promise.reject("X"), soon(3)])
    .then((array) => {
      console.log("We should not get here");
    })
    .catch((error) => {
      if (error != "X") {
        console.log("Unexpected failure:", error);
      }
    });
}

testPromise_all();
