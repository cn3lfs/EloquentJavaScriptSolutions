import { createServer } from "http";
import ecstatic from "ecstatic";

import Router from "./router.js";
import registerRoute from './registerRoute.js'

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

    const fileServer = ecstatic({ root: "./public" });

    this.server = createServer((request, response) => {
      // 路由解析，并处理请求
      let resolved = router.resolve(this, request);
      if (resolved) {
        resolved
          // error first. 先检查错误
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
            response.writeHead(status, response);
            response.end(body);
          });
      } else {
        // 静态文件服务
        fileServer(request, response);
      }
    });
  }
  start(port) {
    this.server.listen(port);
  }
  stop() {
    this.server.close();
  }
}

