import { performance } from "perf_hooks";

const roads = [
  "Alice's House-Bob's House",
  "Alice's House-Cabin",
  "Alice's House-Post Office",
  "Bob's House-Town Hall",
  "Daria's House-Ernie's House",
  "Daria's House-Town Hall",
  "Ernie's House-Grete's House",
  "Grete's House-Farm",
  "Grete's House-Shop",
  "Marketplace-Farm",
  "Marketplace-Post Office",
  "Marketplace-Shop",
  "Marketplace-Town Hall",
  "Shop-Town Hall",
];

function buildGraph(edges) {
  let graph = Object.create(null);
  function addEdge(from, to) {
    if (graph[from] == null) {
      graph[from] = [to];
    } else {
      graph[from].push(to);
    }
  }
  for (let [from, to] of edges.map((r) => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

const roadGraph = buildGraph(roads);

class VillageState {
  constructor(place, parcels) {
    this.place = place;
    this.parcels = parcels;
  }

  move(destination) {
    // 如果当前所在地没有道路通往目标地，则直接返回。
    if (!roadGraph[this.place].includes(destination)) {
      return this;
    } else {
      let parcels = this.parcels
        .map((p) => {
          // 如果包裹所在地和机器人所在地不一样，则属于后面要派送的包裹，直接返回
          if (p.place != this.place) return p;
          // 如果机器人刚好在包裹所在地，则把包裹带过去，因此包裹的所在地和目标地变成一样的了
          return { place: destination, address: p.address };
        })
        // 过滤后只剩下未派送的包裹
        .filter((p) => p.place != p.address);

      // 机器人已经到达目标地，更新状态
      return new VillageState(destination, parcels);
    }
  }

  static random(parcelCount = 5) {
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
      // 随机选择一个投递地址
      let address = randomPick(Object.keys(roadGraph));
      // 包裹的位置不能和投递地址一样
      let place;
      do {
        place = randomPick(Object.keys(roadGraph));
      } while (place == address);
      parcels.push({ place, address });
    }
    return new VillageState("Post Office", parcels);
  }
}

function testMove() {
  let first = new VillageState("Post Office", [
    { place: "Post Office", address: "Alice's House" },
  ]);
  let next = first.move("Alice's House");

  console.log(next.place);
  // → Alice's House
  console.log(next.parcels);
  // → []
  console.log(first.place);
  // → Post Office
}

// testMove();

// 运行机器人
function runRobot(state, robot, memory) {
  for (let turn = 0; ; turn++) {
    if (state.parcels.length == 0) {
      // console.log(`Done in ${turn} turns`);
      return turn;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
    // console.log(`Moved to ${action.direction}`);
  }
}

// 路线1：随机路线
function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length);
  return array[choice];
}

function randomRobot(state) {
  return { direction: randomPick(roadGraph[state.place]) };
}

// 路线2：固定路线
const mailRoute = [
  "Alice's House",
  "Cabin",
  "Alice's House",
  "Bob's House",
  "Town Hall",
  "Daria's House",
  "Ernie's House",
  "Grete's House",
  "Shop",
  "Grete's House",
  "Farm",
  "Marketplace",
  "Post Office",
];

function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return { direction: memory[0], memory: memory.slice(1) };
}

// 路线3：自动寻路
function findRoute(graph, from, to) {
  let work = [{ at: from, route: [] }];
  for (let i = 0; i < work.length; i++) {
    let { at, route } = work[i];

    // 循环当前位置可抵达的位置
    for (let place of graph[at]) {
      // 如果可抵达的位置刚好是目标地，则加入路由
      if (place == to) return route.concat(place);
      // 如果可抵达的位置不在当前路线列表，则从可抵达的位置出发，建立新的路线
      if (!work.some((w) => w.at == place)) {
        work.push({ at: place, route: route.concat(place) });
      }
    }
  }
}

function goalOrientedRobot({ place, parcels }, route) {
  if (route.length == 0) {
    // 从第一个包裹开始派送
    let parcel = parcels[0];

    // 如果包裹的位置和当前位置不一样，先规划拿包裹的路线
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      // 拿到包裹后，规划派送包裹的路线
      route = findRoute(roadGraph, place, parcel.address);
    }
  }

  // route的第一项是当前位置要移动的方向，后面几项表示接下来的路线
  return { direction: route[0], memory: route.slice(1) };
}

// 优化goalOrientedRobot
function lazyRobot({ place, parcels }, route) {
  if (route.length == 0) {
    // Describe a route for every parcel 对所有包裹进行路线规划
    let routes = parcels.map((parcel) => {
      if (parcel.place != place) {
        return {
          route: findRoute(roadGraph, place, parcel.place),
          // pick up 为true，表示要先去拿包裹
          pickUp: true,
        };
      } else {
        return {
          route: findRoute(roadGraph, place, parcel.address),
          // pick up 为true，表示要去配送包裹
          pickUp: false,
        };
      }
    });

    // This determines the precedence a route gets when choosing.
    // Route length counts negatively, routes that pick up a package
    // get a small bonus.
    // 路线越长，得分越低，默认拿包裹得0.5分
    function score({ route, pickUp }) {
      return (pickUp ? 0.5 : 0) - route.length;
    }
    // 获得得分最高的路线
    route = routes.reduce((a, b) => (score(a) > score(b) ? a : b)).route;
  }

  return { direction: route[0], memory: route.slice(1) };
}

// 模拟机器人运输和投递包裹
function testRunRobot() {
  runRobot(VillageState.random(), randomRobot);

  // runRobot(VillageState.random(), routeRobot, []);

  // runRobot(VillageState.random(), goalOrientedRobot, []);
}

// testRunRobot();

function compareRobots(robot1, memory1, robot2, memory2) {
  let sum1 = 0,
    sum2 = 0,
    n = 100;
  for (let i = 0; i < n; i++) {
    const tasks = VillageState.random();
    const step1 = runRobot(tasks, routeRobot, memory1);
    sum1 += step1;

    const step2 = runRobot(tasks, goalOrientedRobot, memory2);
    sum2 += step2;
  }
  console.log(`${n} tasks, robot1 Done in average ${sum1 / n} turns`);
  console.log(`${n} tasks, robot2 Done in average ${sum2 / n} turns`);
}

function testCompareRobots() {
  compareRobots(routeRobot, [], goalOrientedRobot, []);
}

// testCompareRobots();

// 支持任意数量的robot
function compareRobotsImprove(n, ...robots) {
  const t0 = performance.now();
  const robotList = robots.map((robot) => {
    return {
      name: robot.name,
      robot,
      memory: [],
      sum: 0,
    };
  });

  for (let i = 0; i < n; i++) {
    const tasks = VillageState.random(1000);
    robotList.forEach((robotModel) => {
      robotModel.sum += runRobot(tasks, robotModel.robot, robotModel.memory);
    });
  }

  robotList.forEach((robotModel) => {
    console.log(
      `${n} tasks, robot ${robotModel.name} Done in average ${
        robotModel.sum / n
      } turns`
    );
  });
  const t1 = performance.now();
  console.log(`took ${t1 - t0} milliseconds.`);
}

function testCompareRobotsImprove() {
  compareRobotsImprove(
    100,
    randomRobot,
    routeRobot,
    goalOrientedRobot,
    lazyRobot
  );
}

// testCompareRobotsImprove();
