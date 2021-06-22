function handleAction(state, action) {
  if (action.type == "setUser") {
    localStorage.setItem("userName", action.user);
    return Object.assign({}, state, { user: action.user });
  } else if (action.type == "setTalks") {
    return Object.assign({}, state, { talks: action.talks });
  } else if (action.type == "newTalk") {
    fetchOK(talkURL(action.title), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presenter: state.user,
        summary: action.summary,
      }),
    }).catch(reportError);
  } else if (action.type == "deleteTalk") {
    fetchOK(talkURL(action.talk), { method: "DELETE" }).catch(reportError);
  } else if (action.type == "newComment") {
    fetchOK(talkURL(action.talk) + "/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: state.user,
        message: action.message,
      }),
    }).catch(reportError);
  }
  return state;
}

function fetchOK(url, options) {
  return fetch(url, options).then((response) => {
    if (response.status < 400) return response;
    else throw new Error(response.statusText);
  });
}

function talkURL(title) {
  return "talks/" + encodeURIComponent(title);
}

function reportError(error) {
  alert(String(error));
}

function renderUserField(name, dispatch) {
  return elt(
    "label",
    {},
    "Your name: ",
    elt("input", {
      type: "text",
      value: name,
      onchange(event) {
        dispatch({ type: "setUser", user: event.target.value });
      },
    })
  );
}

function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

function renderTalk(talk, dispatch) {
  return elt(
    "section",
    { className: "talk" },
    elt(
      "h2",
      null,
      talk.title,
      " ",
      elt(
        "button",
        {
          type: "button",
          onclick() {
            dispatch({ type: "deleteTalk", talk: talk.title });
          },
        },
        "Delete"
      )
    ),
    elt("div", null, "by ", elt("strong", null, talk.presenter)),
    elt("p", null, talk.summary),
    ...talk.comments.map(renderComment),
    elt(
      "form",
      {
        onsubmit(event) {
          event.preventDefault();
          let form = event.target;
          dispatch({
            type: "newComment",
            talk: talk.title,
            message: form.elements.comment.value,
          });
          form.reset();
        },
      },
      elt("input", { type: "text", name: "comment" }),
      " ",
      elt("button", { type: "submit" }, "Add comment")
    )
  );
}

function renderComment(comment) {
  return elt(
    "p",
    { className: "comment" },
    elt("strong", null, comment.author),
    ": ",
    comment.message
  );
}

function renderTalkForm(dispatch) {
  let title = elt("input", { type: "text" });
  let summary = elt("input", { type: "text" });
  return elt(
    "form",
    {
      onsubmit(event) {
        event.preventDefault();
        dispatch({
          type: "newTalk",
          title: title.value,
          summary: summary.value,
        });
        event.target.reset();
      },
    },
    elt("h3", null, "Submit a Talk"),
    elt("label", null, "Title: ", title),
    elt("label", null, "Summary: ", summary),
    elt("button", { type: "submit" }, "Submit")
  );
}

async function pollTalks(update) {
  // 版本tag
  let tag = undefined;
  // 循环发起请求
  for (;;) {
    let response;
    try {
      // 发起请求
      response = await fetchOK("/talks", {
        headers: tag && { "If-None-Match": tag, Prefer: "wait=90" },
      });
    } catch (e) {
      console.log("Request failed: " + e);
      // 模拟python中的sleep
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    // 返回304，接着发起下一个请求
    if (response.status == 304) continue;
    // 更新版本tag
    tag = response.headers.get("ETag");
    // 更新数据
    update(await response.json());
  }
}

class SkillShareApp {
  constructor(state, dispatch) {
    this.dispatch = dispatch;
    this.talkDOM = elt("div", { className: "talks" });
    this.talkMap = Object.create(null);

    this.dom = elt(
      "div",
      null,
      renderUserField(state.user, dispatch),
      this.talkDOM,
      renderTalkForm(dispatch)
    );
    this.syncState(state);
  }

  syncState(state) {
    if (state.talks == this.talks) return;
    this.talks = state.talks;

    for (let talk of state.talks) {
      let cmp = this.talkMap[talk.title];
      if (
        cmp &&
        cmp.talk.presenter == talk.presenter &&
        cmp.talk.summary == talk.summary
      ) {
        // 如果talkMap中存在这个会议，直接更新数据
        cmp.syncState(talk);
      } else {
        // 如果会议存在就先移除
        if (cmp) cmp.dom.remove();
        // 创建新会议
        cmp = new Talk(talk, this.dispatch);
        // 存到talkMap中
        this.talkMap[talk.title] = cmp;
        // 显示新的会议
        this.talkDOM.appendChild(cmp.dom);
      }
    }
    for (let title of Object.keys(this.talkMap)) {
      if (!state.talks.some((talk) => talk.title == title)) {
        this.talkMap[title].dom.remove();
        delete this.talkMap[title];
      }
    }
  }
}

class Talk {
  constructor(talk, dispatch) {
    // 评论
    this.comments = elt("div");
    this.dom = elt(
      "section",
      { className: "talk" },
      // 会议标题
      elt(
        "h2",
        null,
        talk.title,
        " ",
        // 删除该会议
        elt(
          "button",
          {
            type: "button",
            onclick: () => dispatch({ type: "deleteTalk", talk: talk.title }),
          },
          "Delete"
        )
      ),
      // 主持人
      elt("div", null, "by ", elt("strong", null, talk.presenter)),
      // 总结
      elt("p", null, talk.summary),
      // 评论
      this.comments,
      // 增加评论表单
      elt(
        "form",
        {
          onsubmit(event) {
            event.preventDefault();
            let form = event.target;
            dispatch({
              type: "newComment",
              talk: talk.title,
              message: form.elements.comment.value,
            });
            form.reset();
          },
        },
        elt("input", { type: "text", name: "comment" }),
        " ",
        elt("button", { type: "submit" }, "Add comment")
      )
    );
    this.syncState(talk);
  }

  syncState(talk) {
    this.talk = talk;
    // 生成评论DOM
    this.comments.textContent = "";
    for (let comment of talk.comments) {
      this.comments.appendChild(renderComment(comment));
    }
  }
}

function runApp() {
  // 用户
  let user = localStorage.getItem("userName") || "Anon";
  // 状态和应用
  let state, app;

  function dispatch(action) {
    // 处理action
    state = handleAction(state, action);
    // 同步状态
    app.syncState(state);
  }

  // 发起长轮询
  pollTalks((talks) => {
    // 这个是update hook，返回新数据时调用这个hook

    // app 还未初始化
    if (!app) {
      state = { user, talks };
      app = new SkillShareApp(state, dispatch);
      document.body.appendChild(app.dom);
    } else {
      // 更新数据
      dispatch({ type: "setTalks", talks });
    }
  }).catch(reportError);
}

runApp();
