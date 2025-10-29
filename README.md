# 📚 Lanchonete Limarques - Flashcards

Um sistema de flashcards com **repetição espaçada** (algoritmo SM-2 do Anki) para aprender os códigos dos produtos da Lanchonete Limarques.

## ✨ Features

- 🎯 **62 produtos** cadastrados
- 🧠 **Repetição espaçada** inteligente (algoritmo SM-2)
- 💾 **Persistência** no localStorage do navegador
- 📊 **Progresso automático** de aprendizado
- 🎨 Interface moderna e responsiva
- ⚡ Deploy automático no Netlify

## 🚀 Como Usar

### Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

## 📦 Como Funciona

### Algoritmo SM-2 (Repetição Espaçada)

O sistema usa o mesmo algoritmo do Anki:

#### Quando você **ACERTA**:
- ✅ Intervalo aumenta exponencialmente (1 dia → 3 dias → ...)
- ✅ `easeFactor` melhora (+0.1)
- ✅ Card sai da fila até o intervalo passar

#### Quando você **ERRA**:
- ❌ Card volta para revisão em **5 minutos**
- ❌ `easeFactor` reduz (-0.2)
- ❌ Card vai pro final da fila (ou +5 posições)

### Estrutura de Dados

```typescript
{
  "cardStats": {
    "1": {
      "interval": 3,           // dias
      "repetitions": 2,         // acertos seguidos
      "easeFactor": 2.6,       // dificuldade
      "nextReview": 1698633600000, // timestamp
      "totalAttempts": 5,
      "correctAttempts": 3
    }
  }
}
```

## 🛠️ Stack Técnica

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **localStorage** - Persistência

## 📁 Estrutura do Projeto

```
├── components/
│   ├── Flashcard.tsx      # Componente do card
│   └── ProgressBar.tsx     # Barra de progresso
├── constants.ts            # Lista de produtos
├── spacedRepetition.ts    # Algoritmo SM-2
├── types.ts               # TypeScript types
├── App.tsx                # Componente principal
└── index.tsx              # Entry point
```

## 🌐 Deploy

### Netlify

1. Conecte o repositório do GitHub
2. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Deploy automático a cada push!

### GitHub Pages (Alternativa)

```bash
npm run build
npm install -g gh-pages
gh-pages -d dist
```

## 📝 Licença

MIT

## 👨‍💻 Autor

Lanchonete Limarques - Sistema de Flashcards

---

**Desenvolvido com ❤️ para facilitar o aprendizado!**
