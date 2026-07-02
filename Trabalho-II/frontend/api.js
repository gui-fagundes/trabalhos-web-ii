const API_BASE = "";
const SESSION_KEY = "trabalho1_session";

function saveSession(token, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

async function apiFetch(path, options = {}) {
  const session = getSession();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.message || `Erro ${response.status}`;
    throw new Error(message);
  }

  return body;
}

/** Garante que existe sessão válida e, opcionalmente, um dos perfis exigidos. Redireciona para login.html caso contrário. */
function requireAuth(allowedRoles) {
  const session = getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    alert("Você não tem permissão para acessar esta página.");
    window.location.href = "login.html";
    return null;
  }

  return session;
}

function showFormMessage(el, message, isError) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.toggle("text-red-600", !!isError);
  el.classList.toggle("text-accent-600", !isError);
}
