import { roadGraph } from "./roads.js";
import { randomPick } from "./random.js";

export class VillageState {
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

// 运行机器人
export function runRobot(state, robot, memory) {
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
