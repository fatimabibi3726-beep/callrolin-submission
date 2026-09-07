(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const form = document.getElementById("reset-form");
    const status = document.getElementById("reset-status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const submitBtn = form.querySelector("button[type='submit']");

      if (newPassword !== confirmPassword) {
        status.textContent = "Passwords do not match.";
        status.className = "auth-status is-error";
        return;
      }

      submitBtn.disabled = true;
      status.textContent = "Updating...";
      status.className = "auth-status";

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      submitBtn.disabled = false;

      if (error) {
        status.textContent = error.message;
        status.className = "auth-status is-error";
      } else {
        status.textContent = "Password updated! Redirecting to log in...";
        status.className = "auth-status is-success";
        await supabaseClient.auth.signOut();
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    });
  });
})();
