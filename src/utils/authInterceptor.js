const originalFetch = window.fetch;
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function handleLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("selected_username");
  window.location.href = "/login";
}

window.fetch = async function (resource, config = {}) {
  let finalConfig = { ...config };
  
  let response;
  try {
    response = await originalFetch(resource, finalConfig);
  } catch (error) {
    throw error;
  }

  const urlString = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
  const isAuthRequest = 
    urlString.includes('/auth/login') ||
    urlString.includes('/auth/refresh-token') ||
    urlString.includes('/auth/verify-otp') ||
    urlString.includes('/auth/register');

  if (response.status === 401 && !isAuthRequest) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      handleLogout();
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalFetch("https://tiem.digitaligrow.com/api/v1/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      .then(async (refreshResponse) => {
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData.success && refreshData.access_token) {
          localStorage.setItem("access_token", refreshData.access_token);
          if (refreshData.refresh_token) {
            localStorage.setItem("refresh_token", refreshData.refresh_token);
          }
          isRefreshing = false;
          onRefreshed(refreshData.access_token);
        } else {
          isRefreshing = false;
          handleLogout();
        }
      })
      .catch((err) => {
        isRefreshing = false;
        handleLogout();
      });
    }

    return new Promise((resolve) => {
      subscribeTokenRefresh((newAccessToken) => {
        let updatedHeaders = {};
        if (finalConfig.headers) {
          if (finalConfig.headers instanceof Headers) {
            finalConfig.headers.set("Authorization", `Bearer ${newAccessToken}`);
            updatedHeaders = finalConfig.headers;
          } else if (Array.isArray(finalConfig.headers)) {
            const authIdx = finalConfig.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
            if (authIdx !== -1) {
              finalConfig.headers[authIdx] = ['Authorization', `Bearer ${newAccessToken}`];
            } else {
              finalConfig.headers.push(['Authorization', `Bearer ${newAccessToken}`]);
            }
            updatedHeaders = finalConfig.headers;
          } else {
            updatedHeaders = {
              ...finalConfig.headers,
              "Authorization": `Bearer ${newAccessToken}`
            };
          }
        } else {
          updatedHeaders = {
            "Authorization": `Bearer ${newAccessToken}`
          };
        }

        finalConfig.headers = updatedHeaders;
        resolve(originalFetch(resource, finalConfig));
      });
    });
  }

  return response;
};
