import { readStream } from "./util.js";

export default function registerRoute(router) {
  const talkPath = /^\/talks\/([^\/]+)$/;
  const commentPath = /^\/talks\/([^\/]+)\/comments$/;
  const talksPath = /^\/talks$/;
  router.add("GET", talkPath, async (server, title) => {
    if (title in server.talks) {
      return {
        body: JSON.stringify(server.talks[title]),
        headers: {
          "Content-Type": "application/json",
        },
      };
    } else {
      return {
        status: 404,
        body: `No talk '${title}' found`,
      };
    }
  });

  router.add("DELETE", talkPath, async (server, title) => {
    if (title in server.talks) {
      delete server.talks[title];
      server.updated();
    }
    return { status: 204 };
  });

  router.add("PUT", talkPath, async (server, title, request) => {
    let requestBody = await readStream(request);
    let talk;
    try {
      talk = JSON.parse(requestBody);
    } catch (err) {
      return { status: 400, body: "Invalid JSON" };
    }

    if (
      !talk ||
      typeof talk.presenter !== "string" ||
      typeof talk.summary !== "string"
    ) {
      return { status: 400, body: "Bad Request" };
    }

    server.talks[title] = {
      title,
      presenter: talk.presenter,
      summary: talk.summary,
      comments: [],
    };

    server.updated();
    return { status: 204 };
  });

  router.add("POST", commentPath, async (server, title, request) => {
    let requestBody = await readStream(request);
    let comment;
    try {
      comment = JSON.parse(requestBody);
    } catch (err) {
      return { status: 400, body: "Invalid JSON" };
    }

    if (
      !comment ||
      typeof comment.author !== "string" ||
      typeof comment.message !== "string"
    ) {
      return { status: 400, body: "Bad Request" };
    } else if (title in server.talks) {
      server.talks[title].comments.push(comment);
      server.updated();
      return { status: 204 };
    } else {
      return {
        status: 404,
        body: `No talk '${title}' found`,
      };
    }
  });

  router.add("GET", talksPath, async (server, request) => {
    let tag = /"(.*)"/.exec(request.headers["if-none-match"]);
    let wait = /\bwait=(\d+)/.exec(request.headers["prefer"]);
    // 如果没有ETag，或ETag版本落后，正常返回
    if (!tag || tag[1] != server.version) {
      return server.talkResponse();
      // Prefer Header里wait不存在，表示不需要等待
    } else if (!wait) {
      return { status: 304 };
      // 等待指定的XX秒之后
    } else {
      return server.waitForChanges(Number(wait[1]));
    }
  });
}
