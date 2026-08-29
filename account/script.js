(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const panelLogin = document.getElementById("panel-login");
    const panelSignup = document.getElementById("panel-signup");

    function showTab(which) {
      const loginActive = which === "login";
      tabLogin.classList.toggle("is-active", loginActive);
      tabSignup.classList.toggle("is-active", !loginActive);
      tabLogin.setAttribute("aria-selected", String(loginActive));
      tabSignup.setAttribute("aria-selected", String(!loginActive));
      panelLogin.hidden = !loginActive;
      panelSignup.hidden = loginActive;
    }

    tabLogin.addEventListener("click", () => showTab("login"));
    tabSignup.addEventListener("click", () => showTab("signup"));

    // LOGIN
    const loginStatus = document.getElementById("login-status");
    panelLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      loginStatus.textContent = "Logging in...";
      loginStatus.className = "auth-status";

      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        loginStatus.textContent = error.message;
        loginStatus.className = "auth-status is-error";
      } else {
        loginStatus.textContent = "Success! Redirecting...";
        loginStatus.className = "auth-status is-success";
        window.location.href = "admin.html";
      }
    });

    // SIGNUP
    const signupStatus = document.getElementById("signup-status");
    panelSignup.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;

      signupStatus.textContent = "Creating account...";
      signupStatus.className = "auth-status";

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) {
        signupStatus.textContent = error.message;
        signupStatus.className = "auth-status is-error";
      } else {
        signupStatus.textContent = "Account created! You can now log in.";
        signupStatus.className = "auth-status is-success";
        panelSignup.reset();
        setTimeout(() => showTab("login"), 1200);
      }
    });
  });
})();
