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

/**
 * Popula o menu principal e a área de ações de acordo com a sessão.
 * Espera dois containers no header: `[data-nav-links]` e `[data-nav-actions]`.
 * No Trabalho II o comprador tem link para o próprio perfil e o vendedor para
 * o painel + perfil da loja.
 */
function renderHeader() {
  const nav = document.querySelector("[data-nav-links]");
  const actions = document.querySelector("[data-nav-actions]");
  if (!nav || !actions) return;

  const session = getSession();
  const links = ['<a href="index.html" class="hover:text-accent-600">Início</a>',
                 '<a href="categories.html" class="hover:text-accent-600">Explorar produtos</a>'];

  if (!session) {
    nav.innerHTML = links.join("");
    actions.innerHTML = `
      <a href="login.html" class="rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold hover:bg-brand-100">Entrar</a>
      <a href="signup.html" class="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-brand-50 hover:bg-brand-800">Criar conta</a>
    `;
    return;
  }

  const role = session.user.role;
  if (role === "admin") {
    links.push('<a href="admin-dashboard.html" class="hover:text-accent-600">Painel admin</a>');
  }
  if (role === "seller") {
    links.push('<a href="seller-dashboard.html" class="hover:text-accent-600">Painel do vendedor</a>');
    links.push('<a href="profile-seller.html" class="hover:text-accent-600">Perfil da loja</a>');
  }
  if (role === "buyer") {
    links.push('<a href="profile-buyer.html" class="hover:text-accent-600">Meu perfil</a>');
  }

  nav.innerHTML = links.join("");
  actions.innerHTML = `
    <span class="hidden text-sm text-brand-700 sm:inline">Olá, <strong>${session.user.name}</strong></span>
    <button type="button" onclick="logout()" class="rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold hover:bg-brand-100">Sair</button>
  `;
}

document.addEventListener("DOMContentLoaded", renderHeader);
