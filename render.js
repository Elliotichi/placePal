exports.renderLogin = function (res, options = { success: "", failure: "" }) {
    return res.render("pages/loginpage", options);
}

exports.renderHomepage = function (res, options = { success: "", failure: "" }) {
    return res.render("pages/index", options);
}