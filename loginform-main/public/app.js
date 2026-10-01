  let mode = "login";
  const $ = (id) => document.getElementById(id);
  const API = "/api/auth";

  function setMode(m) {
    mode = m;
    const login = m === "login";
    $("tab-login").setAttribute("aria-selected", login);
    $("tab-signup").setAttribute("aria-selected", !login);
    $("name-wrap").hidden = login;
    $("title").textContent = login ? "Welcome back" : "Create your account";
    $("sub").textContent = login ? "Log in to continue." : "Use at least 8 characters for your password.";
    $("submit").textContent = login ? "Log in" : "Create account";
    $("password").autocomplete = login ? "current-password" : "new-password";
    $("msg").textContent = "";
  }
  $("tab-login").onclick = () => setMode("login");
  $("tab-signup").onclick = () => setMode("signup");

  function showWelcome(user) {
    $("auth").hidden = true; $("welcome").hidden = false;
    $("hello").textContent = "Hi, " + user.name;
    $("who").textContent = "Signed in as " + user.email;
  }

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("msg"); msg.className = ""; msg.textContent = "";
    const body = { email: $("email").value, password: $("password").value };
    if (mode === "signup") body.name = $("name").value;
    $("submit").disabled = true;
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.details
          ? Object.entries(data.details).map(([k, v]) => `${k}: ${v[0]}`).join(". ")
          : data.error;
        return;
      }
      sessionStorage.setItem("token", data.token);
      showWelcome(data.user);
    } catch {
      msg.textContent = "Can't reach the server. Check your connection and try again.";
    } finally { $("submit").disabled = false; }
  });

  $("logout").onclick = () => {
    sessionStorage.removeItem("token");
    $("welcome").hidden = true; $("auth").hidden = false; $("form").reset(); setMode("login");
  };

  // Restore session on reload
  (async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) showWelcome((await res.json()).user); else sessionStorage.removeItem("token");
  })();
