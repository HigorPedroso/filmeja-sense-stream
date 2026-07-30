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
