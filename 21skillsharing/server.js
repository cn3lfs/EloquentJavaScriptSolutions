import { createServer } from "http";
import ecstatic from "ecstatic";
import fs from "fs";

import Router from "./router.js";
import registerRoute from "./registerRoute.js";

const router = new Router();
registerRoute(router);

const defaultHeaders = { "Content-Type": "text/plain" };

class SkillShareServer {
  constructor(talks) {
    // 数据
    this.talks = talks;
    this.version = 0;
    // 等待队列
    this.waiting = [];

    // 静态文件服务
    const fileServer = ecstatic({ root: "./public" });

    this.server = createServer((request, response) => {
      // 路由解析，并处理请求
      let resolved = router.resolve(this, request);
      if (resolved) {
        resolved
          // 处理业务异常
          .catch((error) => {
            if (error.status !== null) {
              return error;
            } else {
              return {
                body: String(error),
                status: 500,
              };
            }
          })
          // 正常返回
          .then(({ body, status = 200, headers = defaultHeaders }) => {
            response.writeHead(status, headers);
            response.end(body);
          })
          // 处理程序异常
          .catch((error) => {
            console.log(error);
          });
      } else {
        // 静态文件服务
        fileServer(request, response);
      }
    });

    // 从json中读取数据
    let json;
    try {
      json = JSON.parse(fs.readFileSync("./talks.json", "utf8"));
    } catch (error) {
      json = [];
    } finally {
      this.talks = Object.assign(Object.create(null), json);
    }
  }
  // 服务开始
  start(port) {
    this.server.listen(port);
  }
  // 服务结束
  stop() {
    this.server.close();
  }
  // 返回所有会议的标题
  talkResponse() {
    let talks = [];
    for (let title of Object.keys(this.talks)) {
      talks.push(this.talks[title]);
    }
    return {
      body: JSON.stringify(talks),
      headers: {
        "Content-Type": "application/json",
        ETag: `"${this.version}"`,
        "Cache-Control": "no-store",
      },
    };
  }
  // 等待XX秒之后返回
  waitForChanges(time) {
    return new Promise((resolve, reject) => {
      // 加入等待队列
      this.waiting.push(resolve);
      // 启动一个定时任务
      setTimeout(() => {
        // 如果当前等待队列中不含这一条，直接返回
        if (!this.waiting.includes(resolve)) return;
        // 从等待队列中移除
        this.waiting = this.waiting.filter((r) => r != resolve);
        // XX秒之后返回304
        resolve({ status: 304 });
      }, time * 1000);
    });
  }
  // 数据更新hook
  updated() {
    this.version++;
    let response = this.talkResponse();
    // resolve所有的等待队列，然后清空
    this.waiting.forEach((resolve) => resolve(response));
    this.waiting = [];
    // 数据持久化
    fs.writeFile(
      "./talks.json",
      JSON.stringify(this.talks),
      "utf8",
      (error) => {
        console.log(error);
      }
    );
  }
}

new SkillShareServer(Object.create(null)).start(8000);
