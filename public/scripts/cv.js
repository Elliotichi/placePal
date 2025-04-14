$(document).ready(function () {

  /**
   * @brief Tooltip for CV recommend
   */
  $(document).on("mousemove", ".cv-recommendation", function(event) {

    /* Whenever the mouse moves over the list item */
    const $tooltip = $(this).find(".cv-recommendation-tooltip");
    const $rec = $(this);

    /* Figure out how far it is down/left on the page */
    const recOff = $rec.offset();
    const recTop = $rec.scrollTop();
    const recLeft = $rec.scrollLeft();

    /* Figure out how far the tooltip should appear overall (can't calc from event coordinates b/c absolute) */
    const relativeX = event.clientX - recOff.left + recLeft;
    const relativeY = event.clientY - recOff.top + recTop;
    
    /* Do the CSS */
    $tooltip.css({
      "position": "fixed",
      "display": "block",
      "left": (relativeX + 10) + "px", 
      "top" : (relativeY + 10) + "px",
      "opacity": "1" 
    });
  });
  
  /* Hide on mouse leave */
  $(document).on("mouseleave", ".cv-recommendation", function() {
    $(this).find(".cv-recommendation-tooltip").css({
      "display": "none",
      "opacity": "0"
    });
  });


  $("#upload-cv-btn").click(function (event) {
    $("#cv-upload").click();
    event.preventDefault();
  });

  $("#cv-upload").change(function () {
    if ($(this).prop("files").length > 0) {
      $("#upload-cv-btn").text("Analyzing...");
      $("#upload-cv-btn").prop("disabled", true);
      $("#upload-cv-btn").css("cursor", "wait");
      $("#recommendation-list").empty();
      getCvAnalysis();
    }
  });
});

function getCvAnalysis() {
  const formData = new FormData($("#cv-form")[0]);
  console.log("Sending AJAX request...");

  $.ajax({
    url: "/analyze",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      console.log("AJAX response received");
      response = response.suggestions;
      if (response.length == 0) {
        /* Fallback: nothing to do */
        $("#recommendation-list").append(`<p>We couldn't find any recommendations for you!.</p>`);
        return;
      }

      /* Add recs to the displayed list */
      response.forEach((advice) => {
        $("#recommendation-list").append(`
          <li class="cv-recommendation">
            <p style="margin-right:auto;">${advice.original}</p> 
            <p style="margin-left:auto;">${advice.improved}</p>
            <p class="cv-recommendation-tooltip">${advice.why}</p> 
          </li>`);
      });

      $("#upload-cv-btn").prop("disabled", false);
      $("#upload-cv-btn").css("cursor", "default");
      $("#upload-cv-btn").text("Upload CV");
  

    }, // end success callback
  }); // end ajax
} // end func
