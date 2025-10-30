# 🔐 Configuração de Autenticação - Supabase

## Passos para habilitar o login:

### 1. Habilitar Email Provider no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **Providers**
4. Encontre **Email** e clique nele
5. **Habilite o provider "Email"**
6. Configure:
   - ✅ Enable Email provider (ativar)
   - ✅ Confirm email (opcional - desative para testes)
   - ✅ Secure email change (opcional)

### 2. Criar usuário de teste

1. Vá em **Authentication** → **Users**
2. Clique em **"Add User"** ou **"Invite User"**
3. Preencha:
   - **Email**: seu email (ex: admin@exemplo.com)
   - **Senha**: uma senha forte (mínimo 6 caracteres)
   - ✅ Auto Confirm User (marque esta opção para não precisar confirmar email)

### 3. Testar o login

1. Abra o aplicativo
2. Clique no botão "+" no header
3. Digite o email e senha que você criou
4. Clique em "Entrar"

### 4. Se ainda der erro:

**Verifique no console do navegador:**
- Abra o DevTools (F12)
- Veja a aba Console
- Procure por mensagens de erro específicas

**Possíveis causas:**
- ❌ Email provider não habilitado → Habilite no passo 1
- ❌ Usuário não existe → Crie no passo 2
- ❌ Senha muito curta → Use pelo menos 6 caracteres
- ❌ Email não confirmado → Marque "Auto Confirm User" ao criar

### 5. Executar políticas SQL

Execute o arquivo `supabase_auth_policy.sql` no SQL Editor do Supabase para permitir INSERT apenas para usuários autenticados.

