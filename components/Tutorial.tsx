
import React from 'react';

interface TutorialProps {
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Bem-vindo! 👋</h1>
            <p className="text-lg text-gray-600">Aprenda a usar o sistema de repetição espaçada</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">📚 Como estudar:</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-semibold mb-1">Veja o nome do produto</p>
                  <p className="text-sm">Olhe para o card e leia o nome do produto mostrado.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-semibold mb-1">Pense no código antes de virar</p>
                  <p className="text-sm">Antes de clicar em "Mostrar", imagine mentalmente: você sabe qual é o código deste produto?</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="font-semibold mb-1">Vire o card e confira</p>
                  <p className="text-sm">Clique em "Mostrar" para ver o código correto.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="font-semibold mb-1">Avale se você acertou ou errou</p>
                  <p className="text-sm">Compare: o código que você pensou é igual ao que aparece? Então clique em <span className="font-bold text-green-600">"Acertei"</span> ou <span className="font-bold text-red-600">"Errei"</span>.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-green-800 mb-3">✅ Se você acertou:</h3>
            <p className="text-gray-700">
              O sistema vai aumentar o tempo até você ver este card novamente. Cards que você acerta com frequência aparecerão menos vezes, otimizando seu estudo!
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <h3 className="text-xl font-bold text-red-800 mb-3">❌ Se você errou:</h3>
            <p className="text-gray-700">
              Um popup educativo aparecerá mostrando o código correto. O card voltará para revisão em breve, para que você possa memorizar melhor. O sistema é inteligente e ajusta a dificuldade automaticamente!
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-xl font-bold text-purple-800 mb-3">🧠 Dica importante:</h3>
            <p className="text-gray-700 font-semibold">
              O processo de pensar antes de virar o card é essencial! Isso ativa sua memória e torna o aprendizado mais eficaz. Não tenha pressa, o objetivo é a memorização.
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

