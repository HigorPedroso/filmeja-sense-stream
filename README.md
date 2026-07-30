# 🎬 Filmes Já

Filmes Já é uma aplicação web que utiliza Inteligência Artificial para recomendar filmes de forma personalizada.
A proposta do projeto é oferecer sugestões rápidas e inteligentes baseadas nas preferências do usuário — ajudando cinéfilos a descobrir novos títulos sem perder tempo procurando.

# 🚀 Funcionalidades

🔍 Recomendações automáticas de filmes com base em preferências ou histórico do usuário.

🎞️ Exibição de detalhes do filme (sinopse, elenco, nota, gênero, trailer).

💬 Sistema interativo para refinar as recomendações (“quero algo mais de ação”, “filme parecido com X” etc.).

🌙 Modo escuro e design responsivo.

⚡ Interface rápida e intuitiva.

# 🧠 Tecnologias utilizadas

Frontend: HTML5, CSS3, React, Typescript

Backend: Node.js / Supabase

IA / API: integração com OpenAI e Gemini API e API de recomendação de filmes (TMDB, IMDb API, etc.)

Hospedagem: Vercel

# 💡 Como funciona

O usuário acessa o site e informa o tipo de filme que deseja assistir.

A IA analisa a solicitação (por exemplo: “quero um filme de ação parecido com John Wick”).

O sistema retorna recomendações relevantes, com informações e links para onde assistir.

O usuário pode salvar ou compartilhar suas recomendações favoritas

# 📱 Apps Android e iOS (Capacitor)

O projeto usa [Capacitor](https://capacitorjs.com) para empacotar o mesmo frontend React como app nativo Android e iOS.

- App ID: `com.filmeja.app`
- Config: [capacitor.config.ts](capacitor.config.ts)
- Projetos nativos: `android/` e `ios/`

## Fluxo de trabalho

Sempre que alterar código em `src/`, é preciso reconstruir o bundle web e sincronizar com os projetos nativos antes de rodar/buildar o app:

```bash
npm run build
npx cap sync
```

## Rodando no Android

Requisitos: Android Studio + SDK instalados, e **JDK 21** (o Capacitor 8 exige `sourceCompatibility 21`). Se o `JAVA_HOME` do sistema apontar para um JDK mais antigo, ao abrir a pasta `android/` no Android Studio ele usa automaticamente o JBR (JDK 21) que já vem embutido no próprio Android Studio — não precisa configurar nada. Para build via linha de comando, aponte `JAVA_HOME` para esse JBR, por exemplo:

```bash
# Windows (Git Bash)
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
cd android && ./gradlew.bat assembleDebug
```

Ou simplesmente abra o projeto direto no Android Studio:

```bash
npx cap open android
```

## Rodando no iOS

Requer macOS com Xcode instalado (não é possível compilar/testar iOS no Windows). Em uma máquina Mac, com o repositório clonado e `npm install` + `npm run build` + `npx cap sync` já executados:

```bash
npx cap open ios
```

Depois é só rodar pelo Xcode num simulador ou dispositivo físico (com uma conta Apple Developer configurada para assinatura).

## Ícones e splash screen

Os ícones/splash padrão do Capacitor ainda estão no lugar. Para trocar pela identidade visual do FilmeJá, use [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) a partir de um logo em alta resolução.

## Login com Google nativo

No app (Android/iOS) o login com Google usa o SDK nativo via [@capgo/capacitor-social-login](https://github.com/Cap-go/capacitor-social-login) em vez do redirect OAuth do navegador — no site (web) continua usando `supabase.auth.signInWithOAuth`. A troca é automática conforme a plataforma, ver [src/lib/googleAuth.ts](src/lib/googleAuth.ts).

Para funcionar, falta configurar credenciais externas que só podem ser criadas no Google Cloud Console e no painel do Supabase (não dá pra automatizar por código):

### 1. Google Cloud Console

No mesmo projeto do Google Cloud usado hoje para o login web (mesmo projeto do Client ID que já está cadastrado no Supabase em Authentication → Providers → Google):

1. Confirme/anote o **Web Client ID** (tipo "Web application") já existente — é ele que preenche `webClientId`.
2. Crie um client **Android**: package name `com.filmeja.app` + SHA-1. Para o build de debug local, o SHA-1 já foi extraído aqui:
   ```
   AD:AE:C7:41:21:26:C9:70:B5:68:55:2A:D6:58:F9:83:1F:EB:86:B1
   ```
   (gerado com `cd android && ./gradlew signingReport`). Quando gerar uma keystore de release, repita o processo e cadastre o SHA-1 de release também — e o SHA-1 do **Play App Signing** depois de publicar na Play Store.
3. Crie um client **iOS**: bundle ID `com.filmeja.app`. Esse é o `iOSClientId`.

### 2. Variáveis de ambiente

Preencha no `.env` (já criadas, vazias):

```
VITE_GOOGLE_WEB_CLIENT_ID=<o Web Client ID do passo 1>
VITE_GOOGLE_IOS_CLIENT_ID=<o iOS Client ID do passo 1>
```

### 3. Supabase

Em Authentication → Providers → Google, no campo **"Authorized Client IDs"**, adicione o Web Client ID e o iOS Client ID (separados por vírgula) além do que já estiver lá — o Supabase usa essa lista para validar de quais client IDs ele aceita `idToken` via `signInWithIdToken`.

Depois de preencher tudo, rodar `npm run build && npx cap sync` novamente para propagar as env vars para os apps nativos.
