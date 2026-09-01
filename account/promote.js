(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: { session } } = await supabaseClient.auth.getSession();
    const form = document.getElementById("promote-form");
    const status = document.getElementById("promote-status");

    if (!session) {
      status.textContent = "Please log in first, then come back to this page.";
      status.className = "auth-status is-error";
      form.querySelector("button").disabled = true;
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const code = document.getElementById("invite-code").value.trim();
      const submitBtn = form.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      status.textContent = "Checking...";
      status.className = "auth-status";

      const { data, error } = await supabaseClient.rpc("promote_to_admin", {
        invite_code: code,
      });

      submitBtn.disabled = false;

      if (error || data !== "success") {
        status.textContent = "Invalid invite code.";
        status.className = "auth-status is-error";
        return;
      }

      status.textContent = "Success! You are now an admin. Redirecting...";
      status.className = "auth-status is-success";
      setTimeout(() => {
        window.location.href = "/account/admin.html";
      }, 1200);
    });
  });
})();
