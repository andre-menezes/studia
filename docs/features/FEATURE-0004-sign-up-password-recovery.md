# FEATURE-0004 — Cadastro e recuperação de senha

- **Status:** Accepted
- **Data:** 2026-10-21
- **Contexto:** ADR-0006 (login e-mail + senha); roadmap (decisão D4)

## Objetivo

Permitir que uma pessoa nova crie conta sozinha e recupere o acesso se esquecer a senha. Hoje só existe login com o usuário seed do mock.

## Escopo

- Tela e rota públicas `/signup`, `/forgot-password`, `/reset-password?token=…`.
- Links a partir do login ("Criar conta", "Esqueci minha senha").
- Endpoints, mock, i18n e códigos de erro no mesmo PR.

## Fora do escopo

- Login social (ADR futura).
- Verificação obrigatória de e-mail antes de usar o app (pós-MVP).
- Troca de senha logado / tela de perfil.
- Envio real de e-mail (é do backend; o mock só registra o link no console).

## API

```text
POST /auth/register         { email, password, displayName, timeZone? } → 201 AuthSession (já logado)
POST /auth/password/forgot  { email }                                    → 202 (sempre)
POST /auth/password/reset   { token, password }                         → 204
```

- `register` emite access + refresh como o login (ADR-0006).
- `forgot` responde **202 mesmo se o e-mail não existir** (sem enumeração de contas).
- Token de reset: uso único, expira em **1 hora**. Reset bem-sucedido **revoga todas as sessões** do usuário.
- Senha: mínimo 8 caracteres, máximo 128.
- `timeZone`: IANA do navegador (ADR-0009).
- Erros: `AUTH_EMAIL_TAKEN` (409), `AUTH_PASSWORD_TOO_WEAK` (422), `AUTH_RESET_TOKEN_INVALID` (400, inválido/expirado/usado), `VALIDATION_FAILED` (422).

## Comportamento

1. **Cadastro:** nome, e-mail, senha (com mostrar/ocultar). Validação no client (formato e tamanho) antes de enviar. Sucesso → home autenticada (empty state).
2. **Esqueci a senha:** campo e-mail → mensagem neutra "Se houver uma conta com esse e-mail, enviamos um link". Sem revelar se a conta existe.
3. **Redefinir:** nova senha + confirmação. Sucesso → login com aviso "Senha redefinida, entre com a nova senha". Token inválido → mensagem com link para pedir outro.
4. Rotas públicas redirecionam para home se já autenticado (mesma regra do login).

## Regras

1. Toda lógica HTTP em `features/auth/services/authService.ts`.
2. Rotas novas em `features/auth/routes.ts` com o mesmo guard de rota pública do login.
3. Strings em `auth.signup.*`, `auth.forgot.*`, `auth.reset.*` (pt-BR + en).
4. Mock: usuários em memória; `forgot` imprime `RESET LINK: http://localhost:5173/reset-password?token=…` no console.

## Testes

- Unit: validação do formulário; store `register` aplica sessão.
- E2E: cadastro → home; e-mail repetido → erro; esqueci a senha → (link do mock) → redefinir → login.

## Resultado esperado

Uma pessoa sem conta chega ao app, se cadastra e começa a criar Studies; quem esquece a senha recupera sozinho.

## Referências

- ADR-0005, ADR-0006, ADR-0007, ADR-0009
- `docs/architecture/authentication.md`
