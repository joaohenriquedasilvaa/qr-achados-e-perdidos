# QR Alunos

Cadastro de alunos e geração de QR Codes individuais. Roda 100% no navegador (HTML, CSS e JavaScript puro), sem backend nem banco de dados.

## Como funciona
- `index.html` é o painel: cadastro, lista, busca, edição, exclusão, download PNG, impressão e cópia do link. Os alunos ficam no `localStorage` apenas para facilitar o gerenciamento.
- O QR Code contém um link `https://wa.me/55NUMERO?text=...`. Ao escanear, o WhatsApp abre direto com a conversa e a mensagem "Olá! Achei seu objeto, ele está comigo."
- Não depende de servidor, de URL do site nem de `localStorage` para funcionar: o QR Code já carrega tudo.

## Publicar no GitHub Pages
1. Crie um repositório e envie `index.html`, `style.css`, `app.js` e `README.md` na raiz.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Abra o painel em `https://SEU-USUARIO.github.io/SEU-PROJETO/`.

## Importante
- O número do WhatsApp fica dentro do QR Code; quem escanear consegue vê-lo.
- A lista de alunos fica só no navegador usado no cadastro. Limpar o navegador apaga a lista, mas os QR Codes já impressos continuam funcionando.
