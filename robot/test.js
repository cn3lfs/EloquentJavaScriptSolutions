import { VillageState, runRobot } from "./state.js";
import {
  randomRobot,
  routeRobot,
  goalOrientedRobot,
  lazyRobot,
} from "./robots.js";
import { performance } from "perf_hooks";

/* S10 Modules */

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

testCompareRobotsImprove();
