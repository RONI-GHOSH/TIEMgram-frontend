import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOTP from "./pages/VerifyOTP";
import HomePage from "./pages/Home";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import LandingPage from "./pages/LandingPage";

function App() {
  const location = useLocation();

  const normalizePath = (path) => {
    const cleaned = path.replace(/\/+$|^\s+|\s+$/g, "");
    return cleaned === "" ? "/" : cleaned;
  };

  const getViewForPath = (path, isAuthenticated) => {
    if (path.startsWith("/profile/")) {
      const username = path.substring("/profile/".length);
      if (!isAuthenticated) return "login";
      if (username) {
        localStorage.setItem("selected_username", username);
        return "profile";
      }
    }

    if (path === "/my-profile") {
      return isAuthenticated ? "my-profile" : "login";
    }

    if (path === "/edit-profile") {
      return isAuthenticated ? "edit-profile" : "login";
    }

    if (path === "/home") {
      return isAuthenticated ? "home" : "login";
    }

    if (path === "/login") {
      return isAuthenticated ? "home" : "login";
    }

    if (path === "/signup") {
      return isAuthenticated ? "home" : "signup";
    }

    if (path === "/verify") {
      return "verify";
    }

    if (path === "/landing") {
      return isAuthenticated ? "home" : "landing";
    }

    return isAuthenticated ? "home" : "landing";
  };

  const [currentView, setCurrentView] = useState(() => {
    const token = localStorage.getItem("access_token");
    const isAuthenticated = !!token;
    return getViewForPath(normalizePath(window.location.pathname), isAuthenticated);
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isAuthenticated = !!token;
    setCurrentView(getViewForPath(normalizePath(location.pathname), isAuthenticated));
  }, [location.pathname]);



  // LANDING PAGE
  if (currentView === "landing") {
    return <LandingPage setCurrentView={setCurrentView} />;
  }

  // LOGIN PAGE
  if (currentView === "login") {
    return <Login setCurrentView={setCurrentView} />;
  }



  // SIGNUP PAGE
  if (currentView === "signup") {
    return <Signup setCurrentView={setCurrentView} />;
  }



  // OTP VERIFY PAGE
  if (currentView === "verify") {
    return <VerifyOTP setCurrentView={setCurrentView} />;
  }



  // OTHER USER PROFILE PAGE
  if (currentView === "profile") {
    return <Profile setCurrentView={setCurrentView} />;
  }

  // OWNER PROFILE PAGE
  if (currentView === "my-profile") {
    return <MyProfile setCurrentView={setCurrentView} />;
  }

  // EDIT PROFILE PAGE
  if (currentView === "edit-profile") {
    return <EditProfile setCurrentView={setCurrentView} />;
  }



  // DEFAULT HOME PAGE
  return <HomePage setCurrentView={setCurrentView} />;
}

export default App;