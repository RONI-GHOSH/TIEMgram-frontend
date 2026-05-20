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

  // "landing"
  // "login"
  // "signup"
  // "verify"
  // "home"
  // "profile"
  // "my-profile"
  // "edit-profile"

  const [currentView, setCurrentView] = useState(() => {
    const token = localStorage.getItem("access_token");
    return token ? "home" : "landing";
  });

  useEffect(() => {
    const path = location.pathname;
    const token = localStorage.getItem("access_token");
    const isAuthenticated = !!token;

    if (path.startsWith("/profile/")) {
      if (!isAuthenticated) { setCurrentView("login"); return; }
      const username = path.substring("/profile/".length);
      if (username) {
        localStorage.setItem("selected_username", username);
        setCurrentView("profile");
      }
    } else if (path === "/my-profile") {
      if (!isAuthenticated) { setCurrentView("login"); return; }
      setCurrentView("my-profile");
    } else if (path === "/edit-profile") {
      if (!isAuthenticated) { setCurrentView("login"); return; }
      setCurrentView("edit-profile");
    } else if (path === "/home") {
      if (!isAuthenticated) { setCurrentView("login"); return; }
      setCurrentView("home");
    } else if (path === "/login") {
      if (isAuthenticated) { setCurrentView("home"); return; }
      setCurrentView("login");
    } else if (path === "/signup") {
      if (isAuthenticated) { setCurrentView("home"); return; }
      setCurrentView("signup");
    } else if (path === "/verify") {
      setCurrentView("verify");
    } else if (path === "/landing") {
      if (isAuthenticated) { setCurrentView("home"); return; }
      setCurrentView("landing");
    } else if (path === "/") {
      setCurrentView(isAuthenticated ? "home" : "landing");
    }
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