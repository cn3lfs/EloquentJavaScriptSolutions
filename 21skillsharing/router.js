import { URL } from "url";

export default class Router {
  constructor() {
    this.routes = [];
  }
  // 添加controller
  add(method, url, handler) {
    this.routes.push({ method, url, handler });
  }
  resolve(context, request) {
    let path;
    try {
      // 构建完整URL
      const baseURL = "http://" + request.headers.host + "/";
      const reqUrl = new URL(request.url, baseURL);
      // 取出路径部分
      path = reqUrl.pathname;
    } catch (error) {
      console.log(error);
    }

    for (let { method, url, handler } of this.routes) {
      // 如果url以及method都能够匹配上路由
      let match = url.exec(path);
      if (!match || request.method != method) continue;
      // 获取路径中的参数，这里是{title}
      let urlParts = match.slice(1).map(decodeURIComponent);
      // controller处理
      return handler(context, ...urlParts, request);
    }
    return null;
  }
}
