module.exports = async function handler(req, res) {
  const { default: app } = await import("../dist-api/app.js");
  return app(req, res);
};
