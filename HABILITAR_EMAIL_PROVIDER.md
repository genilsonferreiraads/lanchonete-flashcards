# 📧 Como Habilitar Email Provider no Supabase

## Passo a Passo Visual:

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: **cvjwpgphpvefxnrsdiwo**

### 2. Acesse Authentication → Providers
- No menu lateral esquerdo, clique em **"Authentication"**
- Dentro de Authentication, clique em **"Providers"**

### 3. Habilite o Email Provider
- Procure pelo card/módulo **"Email"** na lista de providers
- Você verá um **toggle switch** no canto superior direito do card
- Clique no toggle para **ativar** (deve ficar verde/azul)
- Se pedir, clique em **"Save"** ou **"Enable"**

### 4. Configurações Recomendadas (Opcional)
Com o Email Provider habilitado, você pode ajustar:
- ✅ **Enable email provider** - Já está habilitado
- ⚠️ **Confirm email** - Pode desativar para testes (evita precisar confirmar email)
- ✅ **Secure email change** - Pode manter ativo

### 5. Criar Usuário (Se ainda não tiver)
- Vá em **Authentication** → **Users**
- Clique em **"Add User"** ou **"Invite User"**
- Preencha:
  - **Email**: escolha um email (ex: admin@lanchonete.com)
  - **Senha**: mínimo 6 caracteres (ex: admin123)
  - ✅ **Auto Confirm User** - Marque esta opção!
- Clique em **"Create user"**

### 6. Teste no Aplicativo
- Abra o app do flashcards
- Clique no botão **"+"** no header
- Digite o email e senha que você criou
- Clique em **"Entrar"**

---

## 🔍 Se não encontrar a opção:

- Certifique-se de que está no projeto correto
- Verifique se sua conta tem permissões de administrador
- Algumas versões do Supabase podem ter layout diferente

## ❓ Ainda com problemas?

Verifique se:
- O toggle está realmente ativado (verde/azul)
- Você salvou as alterações
- O navegador foi atualizado após habilitar

