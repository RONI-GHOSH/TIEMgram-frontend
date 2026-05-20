import React, { useState } from "react";
import { X, Camera, Palette, Type, Clock, Globe, Users, Star, Smile } from "lucide-react";
import { useDropzone } from "react-dropzone";

const TEXT_BACKGROUNDS = [
  "#E91E8C", // Instagram Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange/Yellow
  "#EF4444", // Red
  "#111827", // Dark Gray
];

const TEXT_COLORS = [
  "#FFFFFF",
  "#000000",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#E91E8C",
];

const STICKERS = [
  { id: "stk_party", emoji: "🎉", label: "Party" },
  { id: "stk_love", emoji: "❤️", label: "Love" },
  { id: "stk_fire", emoji: "🔥", label: "Fire" },
  { id: "stk_laugh", emoji: "😂", label: "Laugh" },
  { id: "stk_rocket", emoji: "🚀", label: "Rocket" },
  { id: "stk_cool", emoji: "😎", label: "Cool" },
];

function CreateStoryModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("media"); // "media" | "text"
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // "image" | "video"
  
  // Customization fields
  const [textContent, setTextContent] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#E91E8C");
  const [stickerId, setStickerId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [audience, setAudience] = useState("public"); // "public" | "followers" | "close_friends"
  
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setMediaFile(file);
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    multiple: false
  });

  const handleCreateStory = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please log in first.");
      return;
    }

    setIsCreating(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("type", activeTab === "text" ? "text" : mediaType);
      
      if (textContent.trim()) {
        formData.append("text_content", textContent);
      }
      formData.append("text_color", textColor);
      formData.append("background_color", backgroundColor);
      
      if (stickerId) {
        formData.append("sticker_id", stickerId);
      }
      formData.append("duration_seconds", String(durationSeconds));
      formData.append("audience", audience);

      if (activeTab === "media" && mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://tiem.digitaligrow.com/api/v1/stories", true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve({ ok: true, json: () => Promise.resolve(JSON.parse(xhr.responseText)) });
            } catch (e) {
              resolve({ ok: false, json: () => Promise.resolve({ success: false, message: "Invalid JSON response" }) });
            }
          } else {
            try {
              resolve({ ok: false, json: () => Promise.resolve(JSON.parse(xhr.responseText)) });
            } catch (e) {
              resolve({ ok: false, json: () => Promise.resolve({ success: false, message: "Story upload failed" }) });
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        if (onSuccess) {
          onSuccess(resJson.data);
        }
        onClose();
      } else {
        alert(resJson.message || "Failed to post story.");
      }
    } catch (err) {
      console.error("Error creating story:", err);
      alert(`An error occurred: ${err.message || err}`);
    } finally {
      setIsCreating(false);
      setUploadProgress(0);
    }
  };

  const selectedStickerObj = STICKERS.find(s => s.id === stickerId);

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-zinc-200 dark:border-zinc-900 max-h-[90vh] md:h-[650px] animate-[scaleIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Preview Canvas (Interactive) */}
        <div className="flex-1 bg-zinc-900 dark:bg-zinc-950 flex flex-col justify-center items-center p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-900 relative">
          
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
              {activeTab === "text" ? <Type size={12} /> : <Camera size={12} />}
              {activeTab === "text" ? "Text Story" : `${mediaType} Story`}
            </span>
          </div>

          {/* Close button for entire modal on mobile */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>

          {/* Canvas area replicating smartphone aspect ratio */}
          <div 
            className="w-[280px] h-[450px] sm:w-[300px] sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center transition duration-300 border border-white/5"
            style={{ backgroundColor: activeTab === "text" ? backgroundColor : "#121212" }}
          >
            {activeTab === "text" ? (
              /* TEXT CANVAS PREVIEW */
              <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center select-none">
                <p 
                  className="font-bold text-2xl break-words max-w-full leading-relaxed drop-shadow-md outline-none"
                  style={{ color: textColor }}
                >
                  {textContent || "Start typing your story..."}
                </p>
                {selectedStickerObj && (
                  <div className="absolute top-1/4 animate-bounce text-6xl select-none">
                    {selectedStickerObj.emoji}
                  </div>
                )}
              </div>
            ) : mediaFile ? (
              /* MEDIA CANVAS PREVIEW */
              <div className="w-full h-full relative flex items-center justify-center">
                {mediaType === "video" ? (
                  <video 
                    src={URL.createObjectURL(mediaFile)} 
                    className="w-full h-full object-cover" 
                    controls 
                    muted 
                    loop 
                    autoPlay
                  />
                ) : (
                  <img 
                    src={URL.createObjectURL(mediaFile)} 
                    className="w-full h-full object-cover" 
                    alt="Preview" 
                  />
                )}

                {/* Text Overlay on Media */}
                {textContent && (
                  <div className="absolute inset-x-4 text-center z-10 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-xl">
                    <p 
                      className="font-bold text-lg break-words leading-snug drop-shadow"
                      style={{ color: textColor }}
                    >
                      {textContent}
                    </p>
                  </div>
                )}

                {/* Sticker Overlay on Media */}
                {selectedStickerObj && (
                  <div className="absolute top-8 animate-pulse text-5xl select-none drop-shadow-md">
                    {selectedStickerObj.emoji}
                  </div>
                )}

                {/* Clear Media button */}
                <button
                  onClick={() => setMediaFile(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition shadow"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* EMPTY MEDIA STATE (Dropzone) */
              <div 
                {...getRootProps()}
                className={`w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer border-2 border-dashed border-zinc-700/50 hover:border-zinc-500 rounded-2xl transition bg-zinc-900/40 ${isDragActive ? "border-white bg-zinc-800/60" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400 group-hover:scale-105 transition">
                  <Camera size={26} />
                </div>
                <h4 className="font-bold text-sm text-zinc-200">Upload Photo or Video</h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-[180px]">
                  Drag files here or click to browse files
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Options & Customization Panel */}
        <div className="w-full md:w-[380px] bg-white dark:bg-zinc-950 flex flex-col justify-between max-h-[90vh] md:max-h-full">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create new story</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Share a moment on your feed</p>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tabs Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("media");
                  setStickerId("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "media"
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350"
                }`}
              >
                Media (Image/Video)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("text");
                  setStickerId("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "text"
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350"
                }`}
              >
                Text Canvas
              </button>
            </div>

            {/* Background color selection (Text Mode Only) */}
            {activeTab === "text" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Palette size={14} /> Background Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TEXT_BACKGROUNDS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border border-black/10 dark:border-white/10 transition-transform ${
                        backgroundColor === color ? "scale-110 ring-2 ring-offset-2 ring-zinc-950 dark:ring-white" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom text content input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {activeTab === "text" ? "Canvas Text Content" : "Overlay Text"}
              </label>
              <textarea
                placeholder={activeTab === "text" ? "Type story content here..." : "Add a caption/overlay to media..."}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition text-sm"
                rows={activeTab === "text" ? 4 : 2}
              />
            </div>

            {/* Text color selection */}
            {textContent.trim().length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Text Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTextColor(color)}
                      className={`w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform ${
                        textColor === color ? "scale-110 ring-1 ring-zinc-900 dark:ring-white" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sticker Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Smile size={14} /> Add Sticker Overlay
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => setStickerId(stickerId === sticker.id ? "" : sticker.id)}
                    className={`py-2 px-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      stickerId === sticker.id
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-500"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-2xl select-none">{sticker.emoji}</span>
                    <span className="text-[10px] font-bold tracking-tight">{sticker.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings: Duration and Audience */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              
              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Display Duration</span>
                  <span className="text-zinc-900 dark:text-zinc-250 font-bold">{durationSeconds} seconds</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full accent-red-500 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Audience Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Globe size={14} /> Who can view this
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "public", icon: Globe, label: "Public" },
                    { id: "followers", icon: Users, label: "Followers" },
                    { id: "close_friends", icon: Star, label: "Friends" },
                  ].map((aud) => {
                    const Icon = aud.icon;
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setAudience(aud.id)}
                        className={`py-2 px-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                          audience === aud.id
                            ? "border-zinc-900 dark:border-zinc-200 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[10px] font-bold">{aud.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold transition text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateStory}
              disabled={isCreating || (activeTab === "media" && !mediaFile) || (activeTab === "text" && !textContent.trim())}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-95 text-white font-semibold shadow-md disabled:opacity-40 disabled:pointer-events-none transition text-sm flex items-center justify-center relative overflow-hidden"
            >
              {isCreating ? (
                <>
                  <div className="absolute left-0 top-0 bottom-0 bg-red-700/30 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  <div className="relative z-10 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading... {uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : ''}
                  </div>
                </>
              ) : (
                "Post Story"
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CreateStoryModal;
