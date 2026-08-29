(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Check if logged in
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "index.html";
      return;
    }

    document.getElementById("admin-user-email").textContent = session.user.email;

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });

    // Fetch demo requests
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

    if (!data || data.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    tableWrap.hidden = false;

    data.forEach((row) => {
      const tr = document.createElement("tr");
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
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
