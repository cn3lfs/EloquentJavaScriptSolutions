export function findRoute(graph, from, to) {
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
