
import React from 'react';

interface TutorialProps {
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 bg-white shadow-sm"
        title="Fechar tutorial"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo! 👋</h1>
            <p className="text-base text-gray-600">Aprenda a usar o aplicativo</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <h2 className="text-xl font-bold text-blue-800 mb-3">📚 Como estudar:</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold mb-1">Veja o nome do produto</p>
                  <p className="text-sm">Leia o nome do produto mostrado na tela.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold mb-1">Pense no código antes de virar</p>
                  <p className="text-sm">Antes de clicar em "Mostrar", pense: você sabe qual é o código deste produto?</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold mb-1">Vire e confira</p>
                  <p className="text-sm">Clique em "Mostrar" para ver o código correto.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-semibold mb-1">Avale se acertou ou errou</p>
                  <p className="text-sm">O código que você pensou é igual ao que aparece? Clique em <span className="font-bold text-green-600">"Acertei"</span> ou <span className="font-bold text-red-600">"Errei"</span>.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-2">✅ Se você acertou:</h3>
            <p className="text-sm text-gray-700">
              Este produto vai demorar mais para aparecer novamente.
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <h3 className="text-lg font-bold text-red-800 mb-2">❌ Se você errou:</h3>
            <p className="text-sm text-gray-700">
              Uma mensagem vai aparecer mostrando o código correto e este produto vai voltar logo para você revisar.
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-2">🧠 Dica:</h3>
            <p className="text-sm text-gray-700">
              Pensar no código antes de virar ajuda você a lembrar melhor. Não tenha pressa!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-primary text-white rounded-lg px-6 py-4 text-lg font-bold hover:bg-primary/90 transition-colors shadow-lg"
          >
            Entendi, vamos começar! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;

