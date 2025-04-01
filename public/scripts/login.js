/**
 * @file login.js
 * @author saul and the goodmans
 * @brief Handles everything for menu navigation in the login screens. Bit briefer than CSS animations.
 * @TODO nothing, shouldn't need any more steps
 */

function switchStep(fromId, toId, callback) {
  /**
   * @brief Does the fade transition but with a bit of sliding. More UX stuff.
   * @TLDR web sucks
   */

  const $from = $("#" + fromId);
  const $to = $("#" + toId);

  /* Start slightly fading out the current form before moving it */
  $from.animate(
    {
      opacity: 0.7,
    },
    70,
    /* Start the full fade-to-zero */
    function () {
      $from.animate(
        {
          opacity: 0,
          left: "-30px",
        },
        180,
        /* Start the leftwards slide */
        function () {
          $from.css("display", "none");
          $to.css({
            opacity: 0,
            left: "30px",
            position: "relative",
            display: "flex",
          });
          /* Horizontal offset of the incoming pane, animate its opacity & left slide */
          $to.animate(
            {
              opacity: 0.3,
            },
            50,
            function () {
              $to.animate(
                {
                  opacity: 1,
                  left: "0px",
                },
                200,
                function () {
                  if (typeof callback === "function") {
                    callback();
                  }
                }
              );
            }
          );
        }
      );
    }
  );
}

$(document).ready(function () {
  /**
   * @brief attach event listeners to switch login steps
   *
   */

  /* Entry screen to role select */
  $("#start-login").click(() => {
    switchStep("entry-step", "role-step");
  });

  /* Role select transitions */
  $("#select-student").click(() => {
    switchStep("role-step", "student-form-step", () => {
      $("#student-email").focus();
    });
  });
  $("#select-agency").click(() => {
    switchStep("role-step", "agency-form-step", () => {
      $("#agency-email").focus();
    });
  });

  /* registration transitions */
  $("#student-register").click(() => {
    switchStep("student-form-step", "registration-step", () => {
      $("#register-email").focus();
    });
  });
  $("#agency-register").click(() => {
    switchStep("agency-form-step", "registration-step", () => {
      $("#register-email").focus();
    });
  });

  /* Back buttons */
  $("#back-to-entry").click(() => {
    switchStep("role-step", "entry-step");
  });
  $("#back-to-role").click(() => {
    switchStep("student-form-step", "role-step");
  });
  $("#agency-back-to-role").click(() => {
    switchStep("agency-form-step", "role-step");
  });
  $("#register-back-to-role").click(() => {
    switchStep("registration-step", "role-step");
  });
});
