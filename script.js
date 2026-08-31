(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const panelLogin = document.getElementById("panel-login");
    const panelSignup = document.getElementById("panel-signup");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");

    function showTab(which) {
      const loginActive = which === "login";
      tabLogin.classList.toggle("is-active", loginActive);
      tabSignup.classList.toggle("is-active", !loginActive);
      tabLogin.setAttribute("aria-selected", String(loginActive));
      tabSignup.setAttribute("aria-selected", String(!loginActive));
      panelLogin.classList.toggle("is-visible", loginActive);
      panelSignup.classList.toggle("is-visible", !loginActive);
      authTitle.textContent = loginActive ? "Welcome back" : "Create your account";
      authSubtitle.textContent = loginActive
        ? "Log in to your Callrolin account"
        : "Sign up to get started with Callrolin";
    }

    tabLogin.addEventListener("click", () => showTab("login"));
    tabSignup.addEventListener("click", () => showTab("signup"));

    // Redirect an already-logged-in visitor straight to their dashboard
    (async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        await redirectByRole(supabaseClient, session.user.id);
      }
    })();

    // LOGIN
    const loginStatus = document.getElementById("login-status");
    panelLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const submitBtn = panelLogin.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      loginStatus.textContent = "Logging in...";
      loginStatus.className = "auth-status";

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        loginStatus.textContent = error.message;
        loginStatus.className = "auth-status is-error";
        submitBtn.disabled = false;
        return;
      }

      loginStatus.textContent = "Success! Redirecting...";
      loginStatus.className = "auth-status is-success";
      await redirectByRole(supabaseClient, data.user.id);
    });

    // SIGNUP
    const signupStatus = document.getElementById("signup-status");
    panelSignup.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      const submitBtn = panelSignup.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      signupStatus.textContent = "Creating account...";
      signupStatus.className = "auth-status";

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) {
        signupStatus.textContent = error.message;
        signupStatus.className = "auth-status is-error";
        submitBtn.disabled = false;
        return;
      }

      // Create their profile row — role always defaults to "user" here.
      // There is no field anywhere for the visitor to choose "admin".
      if (data.user) {
        await supabaseClient.from("profiles").insert([
          { id: data.user.id, full_name: name },
        ]);
      }

      signupStatus.textContent = "Account created! You can now log in.";
      signupStatus.className = "auth-status is-success";
      panelSignup.reset();
      submitBtn.disabled = false;
      setTimeout(() => showTab("login"), 1200);
    });
  });

  // Looks up the logged-in user's role and sends them to the right
  // dashboard. Falls back to the user dashboard if anything is missing,
  // so a normal visitor can never end up on the admin page.
  async function redirectByRole(supabaseClient, userId) {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile && profile.role === "admin") {
      window.location.href = "/account/admin.html";
    } else {
      window.location.href = "/account/dashboard.html";
    }
  }
})();
