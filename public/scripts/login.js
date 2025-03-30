  /**
   * @file login.js
   * @author saul and the goodmans
   * @brief Handles everything for menu navigation in the login screens. Bit briefer than CSS animations.
   * @TODO nothing, shouldn't need any more steps
   */

function switchStep(fromId, toId, callback) {
  /**
   * @brief Quick fade between parts of login flow, with a callback (e.g. to do extra stuff after load)
   */
  $(`#${fromId}`).fadeOut(250, () => {
    $(`#${toId}`).fadeIn(250, () => {
      if (typeof callback === "function") {
        callback();
      }
    });
  });
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
