$(document).ready(function() {
    $(".dropdown-btn").click(function() {
      $(this).toggleClass("active");
      var dropdownContainer = $(".dropdownContainer")
      
      if (dropdownContainer.css("height") === "0px") {
        dropdownContainer.animate({ height: '20%' }, 500);
      } else {
        dropdownContainer.animate({ height: '0px' }, 500);
      }
    });
  });