$(document).ready(function() {
    $(".dropdown-btn").click(function() {
      $(this).toggleClass("active");
      var dropdownContainer = $(".dropdownContainer")
      var targetHeight = dropdownContainer[0].scrollHeight; 
      if (dropdownContainer.css("height") === "0px") {
        dropdownContainer.animate({ height: targetHeight }, 500);
      } else {
        dropdownContainer.animate({ height: '0px' }, 500);
      }
    });
  });