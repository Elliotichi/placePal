exports.renderLogin = function (res, options = { success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/loginpage", options);
};

exports.renderHomepage = function (res, options = { isStudent: true, success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/index", options);
};

exports.renderListing = function (res, options = { isStudent: true, success: "", failure: "" }) {
  const defaults = { success: "", failure: "" };
  options = { ...defaults, ...options };
  return res.render("pages/placementlisting", options);
};

exports.renderForm = function (res, options) {
  return res.render("pages/addplacement", options);
};

exports.renderCV = function (res, options = { isStudent: true }) {
  return res.render("pages/cv", options);
};