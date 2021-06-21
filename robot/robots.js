import { roadGraph } from "./roads.js";
import { findRoute } from "./route.js";
import { randomPick } from "./random.js";
// 路线1：随机路线
export function randomRobot(state) {
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

export function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return { direction: memory[0], memory: memory.slice(1) };
}

// 路线3：自动寻路
export function goalOrientedRobot({ place, parcels }, route) {
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
export function lazyRobot({ place, parcels }, route) {
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
