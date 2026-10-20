# Sacolão do Mineiro

Site institucional do Sacolão do Mineiro, hortifrúti de bairro em Ribeirão Pires/SP. HTML estático, sem etapa de build.

## Estrutura

- `site/index.html`: página principal
- `site/politica-de-privacidade/`, `site/termos-de-uso/`, `site/politica-de-repasse/`: páginas legais
- `site/wp-content/`, `site/wp-includes/`, `site/ext/`: estilos, scripts, fontes e imagens
- `site/favicon.ico`, `site/apple-touch-icon.png`, `site/site.webmanifest`: ícones
- `netlify.toml`: publicação e cabeçalhos

## Rodar localmente

```bash
python -m http.server 8080 --directory site
```

Depois é só abrir http://localhost:8080.

## Publicar no Netlify

Em *Add new site > Import an existing project*, escolher este repositório. O Netlify lê o `netlify.toml`: não há comando de build e a pasta publicada é `site`.

## Contatos

WhatsApp, e-mail, Instagram e Reclame Aqui aparecem no rodapé do `index.html` e das páginas legais. Para trocar o WhatsApp, substituir `5511973162160` em todos os arquivos HTML.
