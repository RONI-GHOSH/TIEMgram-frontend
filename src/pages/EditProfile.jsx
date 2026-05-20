import React, { useState } from "react";

import {
  User,
  Mail,
  Lock,
  Globe,
  Moon,
  Bell,
  Shield,
  Camera,
  Save,
  ChevronRight,
  Compass,
} from "lucide-react";

function EditProfile({ setCurrentView }) {

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && document.documentElement.classList.contains("dark"));
  });

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    department: "",
    year: "",
    semester: "",
    isPrivate: false,
  });
  const [username, setUsername] = useState("john_doe");
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = React.useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage("Error: No access token found.");
      setIsUploadingAvatar(false);
      return;
    }

    const formDataFile = new FormData();
    formDataFile.append("avatar", file);

    try {
      const response = await fetch("https://tiem.digitaligrow.com/api/v1/profile/me/avatar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataFile
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Profile picture updated successfully!");
        setAvatar(data.data?.avatar_url || data.data?.avatar || URL.createObjectURL(file));
      } else {
        setMessage(data.message || "Failed to update profile picture.");
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setMessage("Error connecting to upload server.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const response = await fetch("https://tiem.digitaligrow.com/api/v1/profile/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const profile = data.data;
          setFormData({
            fullName: profile.full_name || "",
            bio: profile.bio || "",
            department: profile.department || "",
            year: profile.year || "",
            semester: profile.semester || "",
            isPrivate: profile.is_private || false,
          });
          setUsername(profile.username || "john_doe");
          setAvatar(profile.avatar_url || profile.avatar || "");
        }
      } catch (err) {
        console.error("Error fetching profile to edit:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage("Error: No access token found. Please login again.");
      setIsSaving(false);
      return;
    }

    const payload = {
      body: {
        full_name: formData.fullName,
        bio: formData.bio,
        department: formData.department,
        year: Number(formData.year) || 1,
        semester: Number(formData.semester) || 1,
        is_private: formData.isPrivate,
      },
    };

    try {
      const response = await fetch("https://tiem.digitaligrow.com/api/v1/profile/me", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Profile updated successfully!");
        // Update stored user object in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userObj.full_name = formData.fullName;
            localStorage.setItem("user", JSON.stringify(userObj));
          } catch (err) {
            console.error(err);
          }
        }
        // Redirect to profile page after 1.5 seconds
        setTimeout(() => {
          if (setCurrentView) setCurrentView("my-profile");
        }, 1500);
      } else {
        setMessage(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  const profileImage =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop";

  return (

    <div
      className={`min-h-screen transition-colors duration-300
      ${
        darkMode
          ? "bg-[#111111] text-white"
          : "bg-[#faf7f7] text-[#2d1c1c]"
      }`}
    >

      {/* TOPBAR */}

      <div
        className={`sticky top-0 z-50 border-b transition-colors duration-300
        ${
          darkMode
            ? "bg-[#1b1b1b] border-[#2c2c2c]"
            : "bg-white border-[#eadcdc]"
        }`}
      >

        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">

          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setCurrentView && setCurrentView("home")}>
            <img src="/logo.png" alt="logo" className="w-9 h-9 object-cover rounded-lg shadow-sm border border-[#eadcdc] dark:border-zinc-800" />
            <h1 className="text-[34px] font-extrabold tracking-tight" style={{ lineHeight: "1.2" }}>
              <span className="text-[#d6333b]">TIEM</span>
              <span className="bg-gradient-to-r from-[#ef553e] to-[#f79b42] bg-clip-text text-transparent">gram</span>
            </h1>
          </div>

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-400 text-white flex items-center justify-center shadow-lg"
          >

            <Moon size={22} />

          </button>

        </div>

      </div>

      {/* MAIN */}

      <div className="max-w-5xl mx-auto px-6 py-12">

        <h2 className="text-5xl font-bold mb-12">

          Edit Profile

        </h2>

        {/* PROFILE CARD */}

        <div
          className={`rounded-3xl p-8 border shadow-sm transition-colors duration-300
          ${
            darkMode
              ? "bg-[#1b1b1b] border-[#2c2c2c]"
              : "bg-white border-[#eadcdc]"
          }`}
        >

          <div className="flex items-center gap-6 flex-wrap">

            <div className={`w-28 h-28 rounded-full p-[3px] relative transition-all duration-300 ${isUploadingAvatar ? "shadow-[0_0_25px_rgba(239,85,62,0.8)] scale-95 bg-gradient-to-tr from-red-600 via-orange-400 to-yellow-500" : "bg-gradient-to-r from-red-600 to-orange-400"}`}>

              <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-white dark:border-[#1b1b1b]">
                <img
                  src={avatar || profileImage}
                  alt=""
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 transition-all duration-300">
                    <svg className="animate-spin h-8 w-8 text-white mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-[10px] font-extrabold tracking-widest uppercase">Uploading</span>
                  </div>
                )}
              </div>

            </div>

            <div>

              <h3 className="text-2xl font-bold">

                {formData.fullName || "John Doe"}

              </h3>

              <p
                className={`mt-1
                ${
                  darkMode
                    ? "text-gray-400"
                    : "text-[#7a5b5b]"
                }`}
              >

                @{username}

              </p>

              <div className="flex gap-4 mt-4">

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />

                <button 
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-400 text-white font-semibold"
                >

                  Change Photo

                </button>

                <button
                  className={`px-5 py-2 rounded-xl transition-colors duration-300
                  ${
                    darkMode
                      ? "bg-[#2c2c2c]"
                      : "bg-[#f3f3f3]"
                  }`}
                >

                  Remove

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* FORM SECTION */}

        <div className="grid md:grid-cols-2 gap-8 mt-10">

          {/* LEFT */}

          <div className="space-y-6">

            <InputCard
              icon={<User size={20} />}
              label="Full Name"
              placeholder="John Doe"
              darkMode={darkMode}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <InputCard
              icon={<User size={20} />}
              label="Username"
              placeholder="john_doe"
              darkMode={darkMode}
              value={username}
              disabled={true}
            />

            <InputCard
              icon={<Mail size={20} />}
              label="Department"
              placeholder="CSE"
              darkMode={darkMode}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />

          </div>

          {/* RIGHT */}

          <div className="space-y-6">

            <InputCard
              icon={<User size={20} />}
              label="Year"
              placeholder="3"
              darkMode={darkMode}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />

            <InputCard
              icon={<User size={20} />}
              label="Semester"
              placeholder="5"
              darkMode={darkMode}
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            />

            <TextAreaCard
              label="Bio"
              placeholder="Tell people about yourself..."
              darkMode={darkMode}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

          </div>

        </div>

        {/* TOGGLES */}

        <div
          className={`rounded-3xl p-8 border mt-10 transition-colors duration-300
          ${
            darkMode
              ? "bg-[#1b1b1b] border-[#2c2c2c]"
              : "bg-white border-[#eadcdc]"
          }`}
        >

          <h3 className="text-2xl font-bold mb-8">

            Preferences

          </h3>

          <div className="space-y-6">

            <ToggleItem
              title="Private Account"
              darkMode={darkMode}
              enabled={formData.isPrivate}
              setEnabled={(val) => setFormData({ ...formData, isPrivate: val })}
            />

            <ToggleItem
              title="Two-Factor Authentication"
              darkMode={darkMode}
            />

            <ToggleItem
              title="Push Notifications"
              darkMode={darkMode}
            />

            <ToggleItem
              title="Email Notifications"
              darkMode={darkMode}
            />

          </div>

        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-semibold ${message.toLowerCase().includes("error") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
            {message}
          </div>
        )}

        {/* SAVE BUTTON */}

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="mt-10 w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-400 text-white font-bold text-lg shadow-lg hover:scale-[1.01] transition flex items-center justify-center gap-3 disabled:opacity-50"
        >

          <Save size={24} />

          {isSaving ? "Saving Changes..." : "Save Changes"}

        </button>

      </div>

    </div>
  );
}

/* INPUT */

function InputCard({
  icon,
  label,
  placeholder,
  darkMode,
  value,
  onChange,
  disabled
}) {

  return (

    <div
      className={`rounded-2xl border p-5 transition-colors duration-300
      ${
        darkMode
          ? "bg-[#1b1b1b] border-[#2c2c2c]"
          : "bg-white border-[#eadcdc]"
      }`}
    >

      <label className="font-semibold block mb-3">

        {label}

      </label>

      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-4 transition-colors duration-300
        ${
          darkMode
            ? "bg-[#2a2a2a]"
            : "bg-[#f8f4f4]"
        }`}
      >

        {icon}

        <input
          type="text"
          placeholder={placeholder}
          className="bg-transparent outline-none w-full disabled:opacity-60"
          value={value}
          onChange={onChange}
          disabled={disabled}
        />

      </div>

    </div>
  );
}

/* TEXTAREA */

function TextAreaCard({
  label,
  placeholder,
  darkMode,
  value,
  onChange
}) {

  return (

    <div
      className={`rounded-2xl border p-5 transition-colors duration-300
      ${
        darkMode
          ? "bg-[#1b1b1b] border-[#2c2c2c]"
          : "bg-white border-[#eadcdc]"
      }`}
    >

      <label className="font-semibold block mb-3">

        {label}

      </label>

      <textarea
        rows="6"
        placeholder={placeholder}
        className={`w-full rounded-xl p-4 outline-none resize-none transition-colors duration-300
        ${
          darkMode
            ? "bg-[#2a2a2a]"
            : "bg-[#f8f4f4]"
        }`}
        value={value}
        onChange={onChange}
      />

    </div>
  );
}

/* SETTINGS CARD (pure design placeholder) */

function SettingsCard({
  icon,
  title,
  darkMode,
}) {

  return (

    <button
      className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-all duration-300
      ${
        darkMode
          ? "bg-[#1b1b1b] border-[#2c2c2c] hover:bg-[#252525]"
          : "bg-white border-[#eadcdc] hover:bg-[#faf5f5]"
      }`}
    >

      <div className="flex items-center gap-4">

        {icon}

        <span className="font-semibold">

          {title}

        </span>

      </div>

      <ChevronRight size={20} />

    </button>
  );
}

/* TOGGLE */

function ToggleItem({
  title,
  darkMode,
  enabled,
  setEnabled
}) {

  const [localEnabled, setLocalEnabled] = useState(true);
  
  const isEnabled = enabled !== undefined ? enabled : localEnabled;
  const toggleEnabled = setEnabled ? () => setEnabled(!enabled) : () => setLocalEnabled(!localEnabled);

  return (

    <div className="flex items-center justify-between">

      <span className="font-medium text-lg">

        {title}

      </span>

      <button
        onClick={toggleEnabled}
        className={`w-16 h-9 rounded-full transition flex items-center px-1
        ${
          isEnabled
            ? "bg-gradient-to-r from-red-600 to-orange-400 justify-end"
            : darkMode
            ? "bg-[#3a3a3a]"
            : "bg-[#dcdcdc]"
        }`}
      >

        <div className="w-7 h-7 rounded-full bg-white" />

      </button>

    </div>
  );
}

export default EditProfile;