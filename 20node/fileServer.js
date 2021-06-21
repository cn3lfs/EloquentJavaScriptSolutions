import { createServer } from "http";
import { parse } from "url";
import mime from "mime";
import { resolve, sep } from "path";
import { createReadStream, createWriteStream } from "fs";
import { stat, readdir, rmdir, unlink, mkdir } from "fs/promises";

const methods = Object.create(null);

const baseDirectory = process.cwd();

function urlPath(url) {
  let { pathname } = parse(url);
  let path = resolve(decodeURIComponent(pathname).slice(1));
  // 不在当前文件夹目录下面，禁止访问
  if (path != baseDirectory && !path.startsWith(baseDirectory + sep)) {
    throw { status: 403, body: "Forbidden" };
  }
  return path;
}

methods.GET = async function (request) {
  let path = urlPath(request.url);
  let stats;
  // 尝试读取路径
  try {
    stats = await stat(path);
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    else return { status: 404, body: "File not found" };
  }
  // 如果是文件夹，则返回文件夹下面的文件列表
  if (stats.isDirectory()) {
    return { body: (await readdir(path)).join("\n") };
  } else {
    // 如果是文件，则返回文件
    return {
      body: createReadStream(path),
      type: mime.getType(path),
    };
  }
};

methods.DELETE = async function (request) {
  let path = urlPath(request.url);
  let stats;
  // 尝试读取路径
  try {
    stats = await stat(path);
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    else return { status: 204 };
  }
  // 如果是文件夹，则删除整个文件夹
  if (stats.isDirectory()) await rmdir(path);
  // 如果是文件，则删除文件
  else await unlink(path);
  return { status: 204 };
};

methods.MKCOL = async function (request) {
  let path = urlPath(request.url);
  let stats;
  // 尝试读取路径
  try {
    stats = await stat(path);
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    await mkdir(path);
    return { status: 204 };
  }
  // 如果是文件夹，则删除整个文件夹
  if (stats.isDirectory()) {
    return { status: 204 };
  } else {
    // 如果是文件，则删除文件
    return { status: 400, body: "Not a directory" };
  }
};

// 转接流
function pipeStream(from, to) {
  return new Promise((resolve, reject) => {
    from.on("error", reject);
    to.on("error", reject);
    to.on("finish", resolve);
    from.pipe(to);
  });
}

methods.PUT = async function (request) {
  let path = urlPath(request.url);
  // 写流
  await pipeStream(request, createWriteStream(path));
  return { status: 204 };
};

// 启动服务
createServer((request, response) => {
  let handler = methods[request.method] || notAllowed;
  handler(request)
    // 错误处理
    .catch((error) => {
      if (error.status != null) return error;
      return { body: String(error), status: 500 };
    })
    //
    .then(({ body, status = 200, type = "text/plain" }) => {
      response.writeHead(status, { "Content-Type": type });
      if (body && body.pipe) body.pipe(response);
      else response.end(body);
    });
}).listen(8000);

// 不允许该请求方式，比如GET写成POST
async function notAllowed(request) {
  return {
    status: 405,
    body: `Method ${request.method} not allowed.`,
  };
}
