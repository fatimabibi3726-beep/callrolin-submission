(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "/";
      return;
    }

    // If this is actually an admin, send them to the admin dashboard
    // instead — normal users should never manually land here after an
    // admin account logs in on the same browser.
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single();

    if (profile && profile.role === "admin") {
      window.location.href = "/account/admin.html";
      return;
    }

    document.getElementById("user-email").textContent = session.user.email;
    const name = (profile && profile.full_name) || session.user.email.split("@")[0];
    document.getElementById("welcome-msg").textContent = "Welcome, " + name;

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/";
    });
  });
})();
