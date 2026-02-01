import { useCallback, useEffect, useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const initialLogin = {
  username: "",
  password: "",
};

const storageKeys = {
  accessToken: "apk_portal_access_token",
  refreshToken: "apk_portal_refresh_token",
  username: "apk_portal_username",
};

function apiUrl(path, params = {}) {
  if (!apiBaseUrl) return "";
  const url = new URL(apiBaseUrl);
  url.searchParams.set("path", path);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function apiPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    // Avoid CORS preflight on Apps Script by using a simple request.
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || data.error || "Request failed");
    err.code = data.error || "UNKNOWN";
    throw err;
  }
  return data;
}

async function apiGet(path, params) {
  const res = await fetch(apiUrl(path, params));
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || data.error || "Request failed");
    err.code = data.error || "UNKNOWN";
    throw err;
  }
  return data;
}

function saveTokens({ accessToken, refreshToken, username }) {
  if (accessToken) localStorage.setItem(storageKeys.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(storageKeys.refreshToken, refreshToken);
  if (username) localStorage.setItem(storageKeys.username, username);
}

function clearTokens() {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.username);
}

function getStored() {
  return {
    accessToken: localStorage.getItem(storageKeys.accessToken),
    refreshToken: localStorage.getItem(storageKeys.refreshToken),
    username: localStorage.getItem(storageKeys.username),
  };
}

export default function App() {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [apks, setApks] = useState([]);
  const [session, setSession] = useState({
    accessToken: "",
    refreshToken: "",
    username: "",
  });

  const isAuthed = Boolean(session.accessToken);
  const canUseApi = useMemo(() => Boolean(apiBaseUrl), []);

  const handleLogout = useCallback(() => {
    clearTokens();
    setSession({ accessToken: "", refreshToken: "", username: "" });
    setApks([]);
    setStatus("idle");
    setError("");
  }, []);

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();
      setStatus("loading");
      setError("");

      try {
        const data = await apiPost("/login", loginForm);
        const nextSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          username: loginForm.username,
        };
        setSession(nextSession);
        saveTokens(nextSession);
        setStatus("authed");
      } catch (err) {
        setStatus("error");
        setError(err.message || "Đăng nhập thất bại.");
      }
    },
    [loginForm]
  );

  const refreshSession = useCallback(async () => {
    const stored = getStored();
    if (!stored.refreshToken || !stored.username) return false;

    try {
      const data = await apiPost("/token/refresh", {
        username: stored.username,
        refreshToken: stored.refreshToken,
      });
      const nextSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        username: stored.username,
      };
      setSession(nextSession);
      saveTokens(nextSession);
      return true;
    } catch (err) {
      handleLogout();
      return false;
    }
  }, [handleLogout]);

  const loadApks = useCallback(async () => {
    if (!session.accessToken) return;

    try {
      const data = await apiGet("/apks", {
        accessToken: session.accessToken,
      });
      setApks(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      if (err.code === "TOKEN_EXPIRED") {
        const refreshed = await refreshSession();
        if (refreshed) {
          const data = await apiGet("/apks", {
            accessToken: getStored().accessToken,
          });
          setApks(Array.isArray(data.data) ? data.data : []);
          return;
        }
      }
      setError(err.message || "Không thể tải danh sách APK.");
    }
  }, [refreshSession, session.accessToken]);

  useEffect(() => {
    if (!canUseApi) {
      setStatus("error");
      setError("Thiếu VITE_API_BASE_URL trong env.");
      return;
    }

    const stored = getStored();
    if (stored.accessToken) {
      setSession(stored);
      setStatus("authed");
    }
  }, [canUseApi]);

  useEffect(() => {
    if (!isAuthed) return;
    loadApks();
  }, [isAuthed, loadApks]);

  return (
    <div className="page">
      <div className="noise" aria-hidden="true" />

      <header className="hero">
        <div className="hero-text">
          <p className="kicker">APK Distribution</p>
          <h1>Danh sách bản build Android</h1>
          <p className="lead">
            Đăng nhập để tải về phiên bản mới nhất. Không có đăng ký.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-card__inner">
            <p className="hero-card__title">Trạng thái truy cập</p>
            {isAuthed ? (
              <div className="user">
                <div className="user-avatar">
                  {session.username?.slice(0, 1)?.toUpperCase() || "U"}
                </div>
                <div>
                  <strong>{session.username || "Người dùng"}</strong>
                  <span>Phiên làm việc đang hoạt động</span>
                </div>
                <button className="ghost" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="login-area">
                <form className="form" onSubmit={handleLogin}>
                  <label>
                    Username
                    <input
                      value={loginForm.username}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
                      }
                      required
                      autoComplete="username"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <button className="cta" type="submit">
                    Đăng nhập
                  </button>
                </form>
              </div>
            )}
            {status === "loading" && (
              <p className="status">Đang xử lý...</p>
            )}
            {status === "error" && <p className="status error">{error}</p>}
          </div>
        </div>
      </header>

      <section className="content">
        <div className="content-header">
          <h2>APK builds</h2>
          <p>
            {isAuthed
              ? "Nhấn tải để lấy file."
              : "Vui lòng đăng nhập để xem danh sách."}
          </p>
        </div>

        <div className="apk-list">
          {isAuthed ? (
            apks.length ? (
              apks.map((apk) => (
                <article className="apk-card" key={`${apk.version}-${apk.url}`}>
                  <div>
                    <p className="apk-version">v{apk.version}</p>
                    <p className="apk-date">{apk.buildDate}</p>
                    <p className="apk-notes">{apk.notes}</p>
                  </div>
                  <a className="cta" href={apk.url} target="_blank" rel="noreferrer">
                    Tải APK
                  </a>
                </article>
              ))
            ) : (
              <p className="empty">Chưa có bản build nào.</p>
            )
          ) : (
            <div className="locked">
              <p>Danh sách build chỉ mở cho tài khoản được duyệt.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <p>
          © 2026 Trần Thanh Quang. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
