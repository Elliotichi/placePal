let sponseredOpps;

$(document).ready(function () {
  getSponsored();
});

function getSponsored() {
  $.ajax({
    url: "/getSponsored",
    method: "GET",
    success: function (response) {
      /* Clear the list for the new result(s) */
      $("#opportunity-list").empty();

      if (response.isempty)
        if (response.length === 0) {
          /* Fallback: nothing matches the search q */
          $("#opportunity-list").append(`<p>No matching jobs found.</p>`);
          return;
        }

      /* Add a listing for each result */
      response.forEach((opportunity) => {
        /* hyphenate title into a slug  */
        let opp_slug = opportunity.title
          .toLowerCase()
          .replace()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim();
        $("#opportunity-list").append(`
                                <li id="sponsored" class="homepage-opportunity-listing" oppid="${
                                  opportunity._id
                                }" id="${opportunity._id.substring(0, 6) + "-" + opp_slug}">
                                    <img class="opportunity-logo" src="${opportunity.logo}">
                                    <p class="opportunity-agency">${opportunity.company} - ${
          opportunity.title
        }</p>
                                    <p class="opportunity-contents">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="var(--text)" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M184 48l144 0c4.4 0 8 3.6 8 8l0 40L176 96l0-40c0-4.4 3.6-8 8-8zm-56 8l0 40L64 96C28.7 96 0 124.7 0 160l0 96 192 0 128 0 192 0 0-96c0-35.3-28.7-64-64-64l-64 0 0-40c0-30.9-25.1-56-56-56L184 0c-30.9 0-56 25.1-56 56zM512 288l-192 0 0 32c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-32L0 288 0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-128z"/></svg>
                                    <span>${opportunity.company}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="var(--text)" viewBox="0 0 384  512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
                                    <span>${opportunity.location}</span>
                                    </p>
                                     <button class="opportunity-like site-btn">
                                        <svg fill="var(--text)" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1s0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5l0 3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2l0-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/></svg>
                                    </button>
                                </li>
                        `);
      });
    },
    error: function (xhr, status, error) {
      alert("There was an issue with your search. Please try again.");
    },
  });
}

