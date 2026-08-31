(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Check if logged in
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "/";
      return;
    }

    // Verify the ROLE, not just that someone is logged in. A normal
    // user who types this URL in manually gets bounced to their own
    // dashboard instead of seeing admin data.
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      window.location.href = "/account/dashboard.html";
      return;
    }

    document.getElementById("admin-user-email").textContent = session.user.email;

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/";
    });

    // ---- Stats + demo requests table ----
    const loadingEl = document.getElementById("admin-loading");
    const tableWrap = document.getElementById("table-wrap");
    const tableBody = document.getElementById("admin-table-body");
    const emptyEl = document.getElementById("admin-empty");

    const { data, error } = await supabaseClient
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });

    loadingEl.hidden = true;

    if (error) {
      loadingEl.hidden = false;
      loadingEl.textContent = "Error loading data: " + error.message;
      return;
    }

    renderStats(data || []);

    if (!data || data.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    tableWrap.hidden = false;

    data.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.style.animationDelay = Math.min(i * 40, 400) + "ms";
      tr.classList.add("row-fade-in");
      const date = row.created_at
        ? new Date(row.created_at).toLocaleString()
        : "";
      tr.innerHTML = `
        <td>${escapeHtml(row.name || "")}</td>
        <td>${escapeHtml(row.email || "")}</td>
        <td>${escapeHtml(row.message || "")}</td>
        <td>${escapeHtml(row.source_page || "")}</td>
        <td>${escapeHtml(date)}</td>
      `;
      tableBody.appendChild(tr);
    });

    // ---- Admin Settings: change password ----
    const settingsForm = document.getElementById("settings-form");
    const settingsStatus = document.getElementById("settings-status");

    settingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const submitBtn = settingsForm.querySelector("button[type='submit']");

      if (newPassword.length < 6) {
        settingsStatus.textContent = "Password must be at least 6 characters.";
        settingsStatus.className = "auth-status is-error";
        return;
      }

      if (newPassword !== confirmPassword) {
        settingsStatus.textContent = "Passwords do not match.";
        settingsStatus.className = "auth-status is-error";
        return;
      }

      submitBtn.disabled = true;
      settingsStatus.textContent = "Updating...";
      settingsStatus.className = "auth-status";

      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      submitBtn.disabled = false;

      if (updateError) {
        settingsStatus.textContent = updateError.message;
        settingsStatus.className = "auth-status is-error";
      } else {
        settingsStatus.textContent = "Password updated successfully.";
        settingsStatus.className = "auth-status is-success";
        settingsForm.reset();
      }
    });
  });

  function renderStats(rows) {
    const total = rows.length;
    const grievance = rows.filter((r) => r.source_page === "grievance-logging").length;
    const helpcenter = rows.filter((r) => r.source_page === "helpcenter").length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-grievance").textContent = grievance;
    document.getElementById("stat-helpcenter").textContent = helpcenter;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
