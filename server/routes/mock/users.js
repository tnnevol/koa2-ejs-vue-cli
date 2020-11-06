/* user 路由 */
function users(router) {
  router.prefix("/api/mock/users");

  router.get("/", function (ctx) {
    ctx.body = "this is a users response!";
  });

  router.post("/login", function (ctx) {
    const tokens = {
      admin: {
        token: "admin-token",
      },
      editor: {
        token: "editor-token",
      },
    };
    const { username } = ctx.request.body;
    ctx.body = {
      code: 200,
      data: {
        token: tokens[username],
      },
    };
  });
  router.get("/info", function (ctx) {
    const users = {
      "admin-token": {
        roles: ["admin"],
        introduction: "I am a super administrator",
        avatar:
          "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif",
        name: "Super Admin",
      },
      "editor-token": {
        roles: ["editor"],
        introduction: "I am an editor",
        avatar:
          "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif",
        name: "Normal Editor",
      },
    };
    const { token } = JSON.parse(ctx.query.token);
    const info = users[token];
    ctx.body = {
      code: 200,
      data: info,
    };
  });
  router.post("/logout", function (ctx) {
    ctx.body = {
      code: 200,
      data: "success",
    };
  });
  return router;
}

module.exports = users;
