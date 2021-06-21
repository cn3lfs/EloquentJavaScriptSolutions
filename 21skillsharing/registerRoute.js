export default function registerRoute(router) {
  const talkPath = /^\/talks\/([^\/]+)$/;

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
    return {status: 204};
  })

  
}
