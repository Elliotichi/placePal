/**
 * @file navbar.js
 * @author saul and the goodmans
 * @brief Handles the sidebar animations (slide in from the side)
 * @TODO seems out of place with the updated site. Investigate alternatives?
 */

$(document).ready(function () {
  $("#sidebar-btn").click(function () {
    $(".dropdownContainer").toggleClass("active");

    if ($(".dropdownContainer").hasClass("active")) {
      $(".dropdownContainer a").each(function (index) {
        $(this)
          .css({ opacity: 0, transform: "translateX(-15px)" })
          .delay(index * 200)
          .animate({ opacity: 1, marginLeft: "15px" }, 300);
      });
    } else {
      $(".dropdownContainer a").animate({ opacity: 0, marginLeft: "-15px" }, 400);
    }
  });
});
