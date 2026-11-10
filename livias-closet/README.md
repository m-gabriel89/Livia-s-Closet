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

## Gestão de estoque (área da equipe)

Acesse `seu-site/#admin` (ou o link “Área da equipe” no rodapé).

- **Estoque:** cadastro e edição de peças (nome, código, categoria, preço, preço “De”, etiqueta, descrição, cores, tamanhos com quantidade e até 4 fotos), painel com totais, busca, filtros, ocultar/mostrar, duplicar e excluir.
- **Pedidos:** todo pedido fechado na loja é registrado (cliente, itens, total, pagamento). A equipe confirma o pedido (isso dá baixa no estoque), cancela (devolve o estoque) ou chama a cliente pelo WhatsApp.

A loja funciona em dois modos, escolhidos sozinhos:

- **Local** (sem chaves): dados só no navegador, senha provisória em `ADMIN_PIN` (`src/data.js`). Serve para testar.
- **Supabase** (com chaves): banco de dados na nuvem, login da equipe com e-mail e senha, fotos hospedadas e atualização em tempo real para todas as clientes.

## Conectar ao Supabase

1. Crie uma conta e um projeto em https://supabase.com.
2. **Authentication → Users → Add user**: crie o usuário da equipe (e-mail e senha). Em **Authentication → Sign In / Providers**, desative “Allow new users to sign up”.
3. Abra `supabase/schema.sql`, troque `seu@email.com` pelo e-mail do passo 2 (em minúsculas) e rode no **SQL Editor**. Isso cria as tabelas, as regras de segurança, o espaço das fotos e a lista da equipe.
4. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.
5. No computador: copie `.env.example` para `.env`, cole os dois valores e rode `npm run dev`. Entre em `#admin` e clique em **Carregar peças de exemplo** (ou comece a cadastrar as suas).
6. Para o site publicado no GitHub Pages: no repositório, **Settings → Secrets and variables → Actions → aba Variables**, crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores. O próximo `git push` já publica conectado.

A chave *anon* pode ficar no site: quem protege os dados são as regras do `schema.sql` (o público só lê peças ativas e só cria pedidos; escrever e ver pedidos é só da equipe). **Nunca** coloque a chave *service_role* no projeto.
