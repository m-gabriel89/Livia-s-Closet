# Livia’s Closet

Loja virtual de moda feminina feita com React + Vite: catálogo com filtros, favoritos, sacola, cupom, checkout e confirmação do pedido por WhatsApp.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

## Estrutura

```
src/
  main.jsx            ponto de entrada
  App.jsx             página, sacola, checkout e modal do produto
  data.js             produtos, categorias e número do WhatsApp
  styles.css          cores da marca, layout e animações
  components/         Card, Reveal (animação de entrada), Manifesto, Heart
  assets/logo.png     logo da loja
```

## Personalizar

- **WhatsApp da loja:** edite `WA` em `src/data.js` (formato 55 + DDD + número).
- **Produtos e preços:** edite a lista `P` em `src/data.js`.
- **Cores:** variáveis no início de `src/styles.css`. O rosa da marca é `--bg: #feccc9`.
- **Cupom:** o código `LIVIA10` (10%) está em `src/App.jsx`.

## Publicar no GitHub Pages

1. Envie o projeto para um repositório no GitHub (branch `main`).
2. Em **Settings → Pages**, em *Source*, escolha **GitHub Actions**.
3. A cada `git push`, o workflow em `.github/workflows/deploy.yml` gera o build e publica o site.

## Publicar na Vercel ou Netlify

Importe o repositório. Comando de build: `npm run build`. Pasta de saída: `dist`.
