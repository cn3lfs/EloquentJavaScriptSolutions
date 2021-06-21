import { defineRequestType, everywhere } from "./crow-tech.js";
import { storage, sendGossip, broadcastConnections, routeRequest } from "./current.js";
/* 
  nest上指定请求类型的 Request Controller
*/

function testDefineRequestType() {
  defineRequestType("note", (nest, content, source, done) => {
    console.log(`${nest.name} received note: ${content}`);
    done();
  });
}

/* 
define a wrapper for defineRequestType that allows the handler function to return a promise or plain value and wires that up to the callback for us.

给defineRequestType定义一个wrapper，允许handler函数返回一个promise并使用callback处理promise的返回值。
*/
export function requestType(name, handler) {
  defineRequestType(name, (nest, content, source, callback) => {
    try {
      Promise.resolve(handler(nest, content, source)).then(
        (response) => callback(null, response),
        (failure) => callback(failure)
      );
    } catch (exception) {
      callback(exception);
    }
  });
}

/* 
ping 检查巢穴旁边的节点是否可到达
*/
requestType("ping", () => "pong");

/* 
转发消息1
*/
requestType("gossip", (nest, message, source) => {
  if (nest.state.gossip.includes(message)) return;
  console.log(`${nest.name} received gossip '${message}' from ${source}`);
  sendGossip(nest, message, source);
});


/* 
转发消息2
*/
requestType("connections", (nest, { name, neighbors }, source) => {
  let connections = nest.state.connections;
  // 如果当前neighbors和connections上的neighbors一致，表示已经转发过了，直接返回
  if (JSON.stringify(connections.get(name)) == JSON.stringify(neighbors))
    return;
  // 否则写入当前connections的map上，并且进行再次转发。
  connections.set(name, neighbors);
  broadcastConnections(nest, name, source);
});

/* 
中转消息
*/
requestType("route", (nest, { target, type, content }) => {
  return routeRequest(nest, target, type, content);
});

/* 
访问存储
*/
requestType("storage", (nest, name) => storage(nest, name));
