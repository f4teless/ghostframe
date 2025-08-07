import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Settings,
  Command,
  Eye,
  Bot,
  MessageSquare,
  Shield,
  GripHorizontal,
} from "lucide-react";
import { AutomationView } from "./AutomationView";
import { SettingsView } from "./SettingsView";
import type { AppSettings } from "./SettingsView";
import { AssistantView } from "./AssistantView";
import { WebAudioCapture } from "./WebAudioCapture";

const App = () => {
  const [mode, setMode] = useState<"assistant" | "automation" | "settings">(
    "assistant"
  );
  const [settings, setSettings] = useState<AppSettings>({
    provider: "gemini",
    apiKey: "",
    screenshotInterval: 5000,
    customInstructions:
      "You are a helpful assistant. Analyze the screen and answer the user's question concisely.",
    profileType: "default",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [timer, setTimer] = useState("00:00");
  const [transcription, setTranscription] = useState("");
  const intervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadSettings = async () => {};
    loadSettings();

    const handleAiResponse = (_event: any, response: any) => {
      const aiMessage: Message = {
        role: "ai",
        content: response.success
          ? response.text
          : `**AI Error:** ${response.error}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    };

    const handleClickThroughToggle = (_event: any, enabled: boolean) => {
      setIsClickThrough(enabled);
    };

    const handleContentProtectionToggle = (_event: any, enabled: boolean) => {
      setIsContentProtected(enabled);
    };

    const handleTranscriptionUpdate = (_event: any, text: string) => {
      setTranscription(text);
    };

    const handleAiResponse = (_event: any, response: any) => {
      console.log("🤖 AI Response received in UI:", response);
      if (response.text) {
        console.log("📝 AI Text Response:", response.text);
        // You could display this in the UI or handle it as needed
      }
      if (response.serverContent?.generationComplete) {
        console.log("✅ AI Response generation complete");
      }
    };

    const handleUpdateResponse = (_event: any, responseText: string) => {
      console.log("📝 Cumulative AI Response:", responseText);
      // This is the full response text as it builds up (like cheating-daddy)
      // You could update a state variable to show this in real-time
    };

    const loadContentProtectionStatus = async () => {
      try {
        const status =
          await window.ghostframe.window?.getContentProtectionStatus?.();
        if (status) {
          setIsContentProtected(status.enabled);
        }
      } catch (error) {
        console.error("Failed to load content protection status:", error);
      }
    };

    if (window.ghostframe?.on) {
      window.ghostframe.on("click-through-toggled", handleClickThroughToggle);
      window.ghostframe.on(
        "content-protection-toggled",
        handleContentProtectionToggle
      );
      window.ghostframe.on("transcription-update", handleTranscriptionUpdate);
      window.ghostframe.on("ai-response", handleAiResponse);
      window.ghostframe.on("update-response", handleUpdateResponse);
    }

    loadContentProtectionStatus();

    return () => {
      if (window.ghostframe?.off) {
        window.ghostframe.off(
          "click-through-toggled",
          handleClickThroughToggle
        );
        window.ghostframe.off(
          "content-protection-toggled",
          handleContentProtectionToggle
        );
        window.ghostframe.off(
          "transcription-update",
          handleTranscriptionUpdate
        );
        window.ghostframe.off("ai-response", handleAiResponse);
        window.ghostframe.off("update-response", handleUpdateResponse);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Clean up WebAudioCapture on unmount
      if (webAudioCapture.current?.isActive()) {
        webAudioCapture.current.stopCapture();
      }
    };
  }, []);

  // Keyboard controls for window movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            window.ghostframe.window?.move?.(0, -20);
            break;
          case "ArrowDown":
            e.preventDefault();
            window.ghostframe.window?.move?.(0, 20);
            break;
          case "ArrowLeft":
            e.preventDefault();
            window.ghostframe.window?.move?.(-20, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            window.ghostframe.window?.move?.(20, 0);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startTimer = () => {
    let seconds = 0;
    intervalRef.current = window.setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      setTimer(`${mins}:${secs}`);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer("00:00");
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      // Stop recording
      try {
        // Stop web-based audio capture if active
        if (webAudioCapture.current?.isActive()) {
          await webAudioCapture.current.stopCapture();
        }

        // Stop main process audio capture (fallback)
        await window.ghostframe.capture?.stopAudio?.();
        await window.ghostframe.capture?.enableTranscription?.(false);

        stopTimer();
        setTranscription("");
      } catch (error) {
        console.error("Error stopping audio capture:", error);
      }
    } else {
      // Start recording
      try {
        let audioStarted = false;

        // Try browser-based audio capture first (loopback audio for Windows)
        if (WebAudioCapture.isSupported()) {
          console.log("🎤 Attempting Windows loopback audio capture...");
          console.log("� Will request microphone access for system audio");

          if (!webAudioCapture.current) {
            webAudioCapture.current = new WebAudioCapture();
          }

          const result = await webAudioCapture.current.startCapture();
          if (result.success) {
            console.log("✅ Windows loopback audio capture started");
            audioStarted = true;
          } else {
            console.warn(
              "❌ Windows loopback audio capture failed:",
              result.error
            );
            // Show user-friendly error in UI
            alert(
              `Audio Capture Failed:\n\n${result.error}\n\nFalling back to text-only mode.`
            );
          }
        }

        // Fallback to main process audio capture if browser method failed
        if (!audioStarted) {
          console.log("🔄 Falling back to main process audio capture...");
          await window.ghostframe.capture?.startAudio?.();
        }

        await window.ghostframe.capture?.enableTranscription?.(true);
        startTimer();
      } catch (error) {
        console.error("Error starting audio capture:", error);
      }
    }
    setIsRecording(!isRecording);
  };

  const handleToggleContentProtection = async () => {
    try {
      const result =
        await window.ghostframe.window?.toggleContentProtection?.();
      if (result) {
        setIsContentProtected(result.enabled);
      }
    } catch (error) {
      console.error("Failed to toggle content protection:", error);
    }
  };

  return (
    <div
      className={`app-container bg-transparent text-white p-4 font-sans ${
        isClickThrough ? "pointer-events-none" : ""
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={handleRecordToggle}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm ${
                isRecording
                  ? "bg-red-500/80 hover:bg-red-600/90 shadow-red-500/25"
                  : "bg-blue-500/80 hover:bg-blue-600/90 shadow-blue-500/25"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <div className="flex flex-col items-center">
              <div className="text-3xl font-light text-white/90 tracking-wider mb-2">
                {timer}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setMode("assistant")}
                  className={`btn-mode ${
                    mode === "assistant"
                      ? "btn-mode-active-blue"
                      : "btn-mode-inactive"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Assistant</span>
                </button>
                <button
                  onClick={() => setMode("automation")}
                  className={`btn-mode ${
                    mode === "automation"
                      ? "btn-mode-active-purple"
                      : "btn-mode-inactive"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Automation</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleContentProtection}
                className={`protection-toggle ${
                  isContentProtected
                    ? "protection-active"
                    : "protection-inactive"
                }`}
                title={
                  isContentProtected
                    ? "Disable content protection"
                    : "Enable content protection"
                }
              >
                {isContentProtected ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setMode("settings")}
                className="settings-btn"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode-Specific Controls */}
          {mode === "assistant" && (
            <div className="assistant-controls">
              <div className="flex items-center justify-between">
                {/* Recording Section */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleRecordToggle}
                    className={`record-button ${
                      isRecording ? "record-active" : "record-inactive"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                  <div className="timer-display">{timer}</div>
                </div>

                {/* Live Transcription Display */}
                {isRecording && (
                  <div className="transcription-area">
                    <div className="text-xs text-blue-400 mb-1 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      Live Transcription
                    </div>
                    <div className="bg-black/30 px-3 py-2 rounded-lg border border-blue-400/30 min-h-[40px] max-h-[80px] overflow-y-auto">
                      {transcription ? (
                        <span className="text-sm text-white/80">
                          {transcription}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40 italic">
                          Listening...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-xs text-white/40">
                    {isRecording && !transcription && (
                      <span>
                        🎤 Recording both internal and external audio...
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant Actions */}
                <div className="action-buttons">
                  <button
                    onClick={() =>
                      window.ghostframe.capture?.takeScreenshot?.()
                    }
                    className="action-btn"
                  >
                    <span>Screenshot</span>
                  </button>
                  <button
                    onClick={() => setShowInput(!showInput)}
                    className="action-btn action-primary"
                  >
                    <span>Ask</span>
                    <Command className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "automation" && (
            <div className="automation-controls">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/70">
                  🤖 Browser Automation Mode
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() =>
                      window.ghostframe.automation?.startSession?.()
                    }
                    className="action-btn action-primary"
                  >
                    <span>Start Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          {mode === "assistant" && showInput && (
            <AssistantView
              settings={settings}
              showInput={showInput}
              isAiReady={isAiReady}
            />
          )}
          {mode === "automation" && <AutomationView />}
          {mode === "settings" && (
            <SettingsView settings={settings} setSettings={setSettings} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
