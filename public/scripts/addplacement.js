/**
 * @brief A "demo" version as a cop-out in case Stripe integration can't be done in time
 * 
 */
$(document).ready(function() {
    const $paymentButton = $('#add-btn');
    const $redirectOverlay = $('#redirect-overlay');
    const $form = $('#placement-add-form');

    $paymentButton.on("click", function(event) {
        event.preventDefault();
        console.log("Clicked!");

        if (!$form[0].checkValidity()) {
            $form[0].reportValidity(); 
            return;
        }

        $paymentButton.prop('disabled', true).text('Processing...');

        setTimeout(function() {
            $redirectOverlay.fadeIn(); 
        }, 1500);
    });
});