"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import About from "./components/About";
import ASCIIText from './components/ASCIIText';

type FilterType = "none" | "grayscale" | "sepia" | "vintage" | "cold" | "warm" | "noir" | "fade" | "dramatic";

const FILTERS: Record<FilterType, string> = {
  none: "",
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  vintage: "sepia(50%) contrast(110%) brightness(110%)",
  cold: "hue-rotate(180deg) saturate(150%)",
  warm: "sepia(30%) saturate(130%) brightness(105%)",
  noir: "grayscale(100%) contrast(150%) brightness(90%)",
  fade: "contrast(85%) brightness(115%) saturate(50%)",
  dramatic: "contrast(150%) brightness(90%) saturate(80%)",
};

export default function Home() {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none");
  const [activeSection, setActiveSection] = useState("home");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [stripCount, setStripCount] = useState<2 | 4 | 6 | 8>(4);
  const [stripImages, setStripImages] = useState<string[]>([]);
  const [isStripMode, setIsStripMode] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [autoCapture, setAutoCapture] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (timerEnabled) {
      setCountdown(timerSeconds);
    } else {
      executeCapture();
    }
  };

  useEffect(() => {
    if (autoCapture && isStripMode && stripImages.length < stripCount) {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
      
      const delay = stripImages.length === 0 ? 2000 : 3000;
      
      autoCaptureTimeoutRef.current = setTimeout(() => {
        capturePhoto();
      }, delay);
    }

    return () => {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapture, isStripMode, stripImages.length, stripCount]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const generateStripCollage = useCallback((images: string[]) => {
    if (!stripCanvasRef.current) return;

    const canvas = stripCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stripWidth = 500;
    const photoWidth = 450;
    const photoHeight = 338;
    const padding = 15;
    const headerHeight = 100;
    const footerHeight = 80;
    const sidePadding = (stripWidth - photoWidth) / 2;
    const totalHeight = headerHeight + (photoHeight * images.length) + (padding * (images.length - 1)) + footerHeight;

    canvas.width = stripWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, stripWidth, totalHeight);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, stripWidth - 20, totalHeight - 20);

    ctx.font = "bold 36px Geist, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PhotoboothUhuy", stripWidth / 2, 60);

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all(images.map(loadImage)).then((loadedImages) => {
      loadedImages.forEach((img, index) => {
        const y = headerHeight + (photoHeight + padding) * index;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sidePadding - 3, y - 3, photoWidth + 6, photoHeight + 6);
        
        ctx.fillStyle = "#000000";
        ctx.fillRect(sidePadding, y, photoWidth, photoHeight);
        
        const imgAspectRatio = img.width / img.height;
        const targetAspectRatio = photoWidth / photoHeight;
        
        let drawWidth = photoWidth;
        let drawHeight = photoHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imgAspectRatio > targetAspectRatio) {
          drawWidth = photoHeight * imgAspectRatio;
          offsetX = -(drawWidth - photoWidth) / 2;
        } else {
          drawHeight = photoWidth / imgAspectRatio;
          offsetY = -(drawHeight - photoHeight) / 2;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(sidePadding, y, photoWidth, photoHeight);
        ctx.clip();
        ctx.drawImage(img, sidePadding + offsetX, y + offsetY, drawWidth, drawHeight);
        ctx.restore();
      });

      ctx.fillStyle = "#ffffff";
      ctx.font = "18px Geist Mono, monospace";
      ctx.textAlign = "center";
      const date = new Date().toLocaleDateString("id-ID", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric" 
      });
      ctx.fillText(`${date} © PhotoboothMishell`, stripWidth / 2, totalHeight - 35);

      const stripData = canvas.toDataURL("image/png");
      setCapturedImages((prev) => [stripData, ...prev].slice(0, 9));
      setPreviewImage(stripData);
      setShowPreview(true);
      setIsStripMode(false);
    });
  }, []);

  const executeCapture = useCallback(() => {
    setCountdown(null);
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${FILTERS[selectedFilter]}`;
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        const imageData = canvas.toDataURL("image/png");
        
        if (isStripMode) {
          setStripImages((prev) => {
            const newImages = [...prev, imageData];
            if (newImages.length === stripCount) {
              generateStripCollage(newImages);
              return [];
            }
            return newImages;
          });
        } else {
          setCapturedImages((prev) => [imageData, ...prev].slice(0, 9));
          setPreviewImage(imageData);
          setShowPreview(true);
        }
      }
    }
  }, [brightness, contrast, selectedFilter, isStripMode, stripCount, generateStripCollage]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      executeCapture();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, executeCapture]);

  const downloadImage = (imageData: string, filename: string = "photobooth-image.png") => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startStripMode = (auto: boolean = false) => {
    setIsStripMode(true);
    setStripImages([]);
    setAutoCapture(auto);
    
    if (auto) {
      setTimeout(() => {
        capturePhoto();
      }, 2000);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar 
        activeSection={activeSection}
        onNavigate={scrollToSection}
        onStartCamera={startCamera}
      />

      <section
        id="home"
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 sm:pt-20 relative bg-gradient-to-b from-white via-violet-50 to-white overflow-hidden"
      >
        <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
          <div className="sticker">📸</div>
          <div className="sticker small">🎉</div>
        </div>
        <div className="absolute inset-0 z-0">
          <ASCIIText
            text="Sobat Uhuyy"
            enableWaves={true}
            asciiFontSize={6}
            textFontSize={180}
            planeBaseHeight={10}
          />
        </div>
        
        <div className="relative z-10 text-center space-y-4 sm:space-y-6 animate-fade-in">
          <div className="backdrop-blur-sm bg-white/30 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/50">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-none bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
              PhotoboothMishel
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 font-light tracking-wide mb-6">
              Jepret. Edit. Pamer.
            </p>
            <button
              onClick={() => {
                scrollToSection("booth");
                startCamera();
              }}
              className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-white text-sm sm:text-base font-medium hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
            >
              Gas Foto Sekarang!
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 animate-bounce z-10">
          <svg
            className="w-6 h-6 text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      <section
        id="booth"
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 relative bg-gray-50"
      >
        <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">Studio Foto</h2>
          <div className="flex justify-center -mt-4 mb-6">
            <span className="badge">Smile 😊</span>
          </div>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Ambil foto instan, tambahkan filter favorit, dan unduh hasilnya. Cocok untuk kenangan cepat atau acara seru bersama teman.
          </p>

          <div className="relative rounded-3xl overflow-hidden border-2 border-gray-200 shadow-xl aspect-video bg-black">
            <div className="sticker top-4 left-4">😊</div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${FILTERS[selectedFilter]}`,
              }}
            />

            {countdown !== null && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                <div className="text-white text-6xl sm:text-9xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {isStripMode && (
              <div className="absolute top-4 left-4 bg-violet-600 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10">
                <p className="text-white text-sm font-medium">
                  {autoCapture ? "Mode Otomatis" : "Mode Manual"}: {stripImages.length} / {stripCount}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={capturePhoto}
              disabled={!stream || autoCapture}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-violet-600 bg-transparent hover:bg-violet-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <div className="w-full h-full rounded-full border-2 border-violet-400" />
            </button>

            {isStripMode && !autoCapture && (
              <button
                onClick={() => {
                  setIsStripMode(false);
                  setStripImages([]);
                  setAutoCapture(false);
                }}
                className="px-4 py-2 text-sm bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
              >
                Batal
              </button>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className="text-gray-700 font-medium">Brightness</label>
                  <span className="text-gray-500 font-mono">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-violet-700"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className="text-gray-700 font-medium">Contrast</label>
                  <span className="text-gray-500 font-mono">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-violet-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium text-sm">Filter</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(Object.keys(FILTERS) as FilterType[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      selectedFilter === filter
                        ? "bg-gradient from-violet-600 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium text-sm">Strip Photos</label>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map((count) => (
                  <button
                    key={count}
                    onClick={() => setStripCount(count as 2 | 4 | 6 | 8)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      stripCount === count
                        ? "bg-gradient- from-violet-600 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {count} Photos
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium text-sm">Countdown Timer</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    timerEnabled ? "bg-violet-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md ${
                      timerEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </button>
                {timerEnabled && (
                  <div className="flex gap-2 flex-1">
                    {[3, 5, 10].map((seconds) => (
                      <button
                        key={seconds}
                        onClick={() => setTimerSeconds(seconds)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          timerSeconds === seconds
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startStripMode(false)}
                disabled={!stream || isStripMode}
                className="py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Manual Strip
              </button>
              <button
                onClick={() => startStripMode(true)}
                disabled={!stream || isStripMode}
                className="py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white border border-violet-600 rounded-lg text-sm sm:text-base font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
              >
                Auto Strip
              </button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={stripCanvasRef} className="hidden" />
      </section>

      <section
        id="gallery"
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 bg-white"
      >
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">Gallery</h2>
          <div className="flex justify-center mb-4">
            <span className="badge">Best Shots ✨</span>
          </div>
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Di sini tersimpan hasil jepretanmu. Klik gambar untuk melihat lebih besar atau unduh hasilnya ke perangkatmu.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {capturedImages.length > 0
              ? capturedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 hover:scale-105 hover:border-violet-400 transition-all duration-300 hover:shadow-xl group relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Captured ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPreviewImage(img);
                            setShowPreview(true);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5 sm:gap-2 shadow"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Lihat</span>
                          <span className="sm:hidden">Buka</span>
                        </button>

                        <button
                          onClick={() => downloadImage(img, `photobooth-${Date.now()}-${idx}.png`)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient from-violet-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-lg"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              : Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl bg-gray-100 border-2 border-gray-200 hover:border-violet-300 transition-all duration-300 flex items-center justify-center group hover:scale-105"
                  >
                    <svg
                      className="w-12 h-12 text-gray-300 group-hover:text-violet-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                ))}
          </div>
        </div>
      </section>

      <About />

      <footer className="border-t border-gray-200 py-8 text-center text-gray-500 text-sm bg-white">
        <p>© 2025 PhotoboothUhuy. All rights reserved.</p>
      </footer>

      {showPreview && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full bg-white rounded-2xl p-4 sm:p-6 animate-fade-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center shadow-lg z-10"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-center mb-3 sm:mb-4 text-gray-900">Preview</h3>

            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 mb-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  downloadImage(previewImage, `photobooth-${Date.now()}.png`);
                  setShowPreview(false);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm sm:text-base font-medium hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2.5 sm:py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
