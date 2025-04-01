exports.renderLogin = function (res, options = { success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/loginpage", options);
};

exports.renderHomepage = function (res, options = { success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/index", options);
};

exports.renderListing = function (res, options = { success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/placementlisting", options);
};
