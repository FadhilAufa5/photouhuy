"use client";

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onStartCamera: () => void;
}

export default function Navbar({ activeSection, onNavigate, onStartCamera }: NavbarProps) {
  const handleStartClick = () => {
    onNavigate("booth");
    onStartCamera();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          PhotoboothUhuy
        </div>

        <ul className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium">
          {[
            { key: "home", label: "Beranda" },
            { key: "booth", label: "Studio" },
            { key: "gallery", label: "Galeri" },
            { key: "about", label: "Tentang" }
          ].map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`hover:text-violet-600 transition-colors relative ${
                  activeSection === item.key
                    ? "text-violet-600"
                    : "text-gray-700"
                }`}
              >
                {item.label}
                {activeSection === item.key && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={handleStartClick}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className="hidden sm:inline">Gas Foto!</span>
          <span className="sm:hidden">Gas!</span>
        </button>
      </nav>

      <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <ul className="flex justify-around px-4 py-3 text-xs font-medium">
          {[
            { key: "home", label: "Beranda" },
            { key: "booth", label: "Studio" },
            { key: "gallery", label: "Galeri" },
            { key: "about", label: "Info" }
          ].map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center gap-1 hover:text-violet-600 transition-colors ${
                  activeSection === item.key
                    ? "text-violet-600"
                    : "text-gray-600"
                }`}
              >
                <span>{item.label}</span>
                {activeSection === item.key && (
                  <span className="w-1 h-1 bg-violet-600 rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
