import { useState, useEffect } from "react";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("pt");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Carregar a preferência salva no localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  // Alternar tema
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDarkMode(!isDarkMode);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#0D081A] w-full max-w-md p-6 rounded-lg shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4 text-white">Configurações</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          X
        </button>

        {/* Seção de Tema */}
        <div className="mb-4">
          <label className="text-white block font-medium mb-1">Tema</label>
          <button
            onClick={toggleTheme}
            className=" bg-[#1E0D4A] hover:bg-[#1e0d4a5e] p-2 rounded-md bg-primary-light dark:bg-primary-dark text-white"
          >
            {isDarkMode ? "Modo Claro" : "Modo Escuro"}
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsTermsOpen(true)}
            className="px-4 py-2 bg-[#1E0D4A] text-white rounded hover:bg-[#1e0d4a5e] mr-4"
          >
            Termos e Condições
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1E0D4A] text-white rounded hover:bg-[#1e0d4a5e]"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>

      {/* Modal de Termos e Condições */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#0D081A] w-full max-w-lg p-6 rounded-lg shadow-lg relative">
            <h2 className="text-xl text-white font-semibold mb-4">Termos e Condições</h2>
            <button
              onClick={() => setIsTermsOpen(false)}
              className="absolute top-4 right-4 text-white-600 hover:text-gray-800"
            >
              X
            </button>
            <p className="text-white mb-4">
              Estes são os Termos e Condições. Ao usar este aplicativo, você
              concorda com todas as políticas descritas aqui.
            </p>
            <p className="text-white">
              Por favor, leia atentamente todos os termos antes de continuar.
              Estes incluem as condições de uso e as diretrizes de privacidade.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsTermsOpen(false)}
                className="px-4 py-2 bg-[#1E0D4A] text-white rounded hover:bg-[#1e0d4a5e]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
