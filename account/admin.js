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

    
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      window.location.href = "/grievance-logging/";
      return;
    }

    document.getElementById("admin-user-email").textContent = session.user.email;

    // Pre-fill and handle Name/Email updates
    const profileNameInput = document.getElementById("profile-name");
    const profileEmailInput = document.getElementById("profile-email");
    profileEmailInput.value = session.user.email;

    const { data: myProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();
    if (myProfile) profileNameInput.value = myProfile.full_name || "";

    const profileForm = document.getElementById("profile-form");
    const profileStatus = document.getElementById("profile-status");

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newName = profileNameInput.value.trim();
      const newEmail = profileEmailInput.value.trim();
      const submitBtn = profileForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      profileStatus.textContent = "Saving...";
      profileStatus.className = "auth-status";

      const { error: nameError } = await supabaseClient
        .from("profiles")
        .update({ full_name: newName })
        .eq("id", session.user.id);

      let emailNote = "";
      if (newEmail && newEmail !== session.user.email) {
        const { error: emailError } = await supabaseClient.auth.updateUser({
          email: newEmail,
        });
        if (emailError) {
          profileStatus.textContent = emailError.message;
          profileStatus.className = "auth-status is-error";
          submitBtn.disabled = false;
          return;
        }
        emailNote = " Check your new email to confirm the change.";
      }

      submitBtn.disabled = false;

      if (nameError) {
        profileStatus.textContent = nameError.message;
        profileStatus.className = "auth-status is-error";
      } else {
        profileStatus.textContent = "Saved." + emailNote;
        profileStatus.className = "auth-status is-success";
      }
    });

  
    const manageAdminsForm = document.getElementById("manage-admins-form");
    const manageAdminsStatus = document.getElementById("manage-admins-status");

    manageAdminsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const targetEmail = document.getElementById("promote-email").value.trim();
      const submitBtn = manageAdminsForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      manageAdminsStatus.textContent = "Updating...";
      manageAdminsStatus.className = "auth-status";

      const { data: result, error: promoteError } = await supabaseClient.rpc(
        "promote_user_by_email",
        { target_email: targetEmail }
      );

      submitBtn.disabled = false;

      if (promoteError || result === "not_authorized") {
        manageAdminsStatus.textContent = "You are not authorized to do this.";
        manageAdminsStatus.className = "auth-status is-error";
      } else if (result === "user_not_found") {
        manageAdminsStatus.textContent = "No account found with that email. They must sign up first.";
        manageAdminsStatus.className = "auth-status is-error";
      } else if (result === "success") {
        manageAdminsStatus.textContent = targetEmail + " is now an admin.";
        manageAdminsStatus.className = "auth-status is-success";
        manageAdminsForm.reset();
      } else {
        manageAdminsStatus.textContent = "Something went wrong.";
        manageAdminsStatus.className = "auth-status is-error";
      }
    });

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/";
    });

  
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
