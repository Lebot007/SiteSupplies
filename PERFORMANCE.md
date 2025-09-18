Melhorias de desempenho (seguras, sem alterar layout)

Objetivo
- Melhorar FCP/LCP e pontuação PageSpeed sem mudar layout ou aparência.
- Aplicar apenas mudanças de baixo risco (preload, atributos de imagem, WebP como fallback, headers de cache, lazy-loading quando seguro).

Resumo das alterações já aplicadas
- `index.html`:
  - Adicionados `<picture>` com `source type="image/webp"` para várias imagens (mantendo GIF/JPG/PNG originais como fallback).
  - Adicionados atributos `loading="lazy"` (onde seguro), `decoding="async"` e `width/height` nas imagens para evitar layout shift.
  - Pré-carregado o CSS local (`dist/styles.css`) com `rel="preload" as="style" onload="this.rel='stylesheet'"` e fallback `noscript`.
  - Pré-carregado o stylesheet do Font Awesome (via `rel=preload` com onload) para reduzir bloqueio de renderização.

Próximos passos recomendados (segurança e como aplicar)

1) Gerar versões WebP das imagens
- Por que: WebP reduz consideravelmente o tamanho das imagens sem perda visível em muitos casos, reduzindo bytes transferidos e melhorando carregamento.
- O que gerar: boll.webp, box.webp, final.webp, m4020.webp, m4070.webp, manutencao.webp (coloque no mesmo diretório que os originais).
- Ferramentas (local, sem risco):
  - cwebp (Google):
    - Windows (chocolatey): choco install webp
    - Exemplo: cwebp -q 80 m4020.jpg -o m4020.webp
  - ImageMagick (convert):
    - convert m4020.jpg -quality 80 m4020.webp
- Recomendações de qualidade: começar com qualidade 75-85 e testar visualmente.

2) Configurar Cache-Control no servidor (sem risco ao layout)
- Objetivo: permitir cache largo para assets estáticos (imagens, CSS, JS) e curto para HTML.
- Exemplo (nginx):
  location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }
  location ~* \.(?:html)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
  }
- Exemplo (Apache .htaccess):
  <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/webp "access plus 30 days"
    ExpiresByType image/jpeg "access plus 30 days"
    ExpiresByType text/css "access plus 30 days"
    ExpiresByType application/javascript "access plus 30 days"
    ExpiresByType text/html "access plus 1 hour"
  </IfModule>

3) Reduzir dependência do Font Awesome (opcional, baixo risco)
- Problema: carregar uma grande stylesheet de ícones aumenta bytes e solicitações.
- Alternativas seguras:
  - Substituir ícones por SVGs inline (copiar apenas os ícones usados: whatsapp, chevron-down, stars, bars, print, headset, truck, check). Isso reduz CSS e evita requests a CDN.
  - Usar um subset local do Font Awesome (projeto mais complexo) — apenas se você tiver familiaridade.
- Passo seguro: manter CDN como está (já pré-carregado). Se quiser reduzir, faça uma cópia do HTML e substitua progressivamente os ícones por SVGs embutidos e verifique visualmente.

4) Verificação pós-alterações
- Local: abra `index.html` via um servidor local (não file://) para reproduzir comportamento correto de requests. Exemplo simples com Python:
  - Windows PowerShell: python -m http.server 8000
  - Acesse: http://localhost:8000/
- Ferramentas: Lighthouse / PageSpeed Insights / DevTools Performance / Network
- Métricas alvo: reduzir transferências (KB), melhorar FCP/LCP e reduzir bloqueio de renderização.

5) Observações importantes sobre LCP
- O elemento LCP provável aqui é o título do hero (texto). Mantivemos GIF de background lazy para não competir com LCP. Caso LCP continue sendo uma imagem, altere a imagem de fundo para ter uma versão estática otimizada (por ex. uma JPG/WEBP leve) como placeholder visível e mantenha GIF como substituição não-critical.

6) Checklist seguro antes do deploy
- Gerar WebP e confirmar existências dos arquivos (ex: m4020.webp).
- Testar localmente via servidor (python -m http.server) e inspecionar rede.
- Confirmar headers Cache-Control no ambiente de hospedagem (Netlify, Vercel, cPanel, nginx etc.).

Se quiser, eu posso:
- Gerar os comandos exatos para converter todas as imagens que você tem localmente (vou apenas mostrar os comandos; não tenho acesso a executar conversões fora do workspace).
- Ajudar a substituir ícones por SVGs inline (faço as substituições no HTML para os ícones mais usados) — isso é opcional e seguro.
- Preparar um pequeno script Node/Powershell para automatizar conversão para WebP e backup dos originais.


Status atual das tasks
- Análise: concluída
- Otimização de imagens (aplicação de tags): concluída (HTML atualizado)
- Redução de bloqueio (preload CSS/FA): concluída
- Cache/Headers: em progresso (documentado)
- Validação: pendente (precisa gerar WebP e testar localmente)

Service Worker e cache (adicionado)
- Foi adicionado um Service Worker (`sw.js`) que faz cache dos assets estáticos (CSS, imagens, favicon) com política cache-first para imagens e network-first para HTML. Isso melhora visitas subsequentes sem alterar o layout.

Como testar o Service Worker localmente
- O SW só funciona via servidor (http(s)). Teste local com Python:
  - `python -m http.server 8000`
  - Abra `http://localhost:8000/` no Chrome e verifique em DevTools > Application > Service Workers se o `sw.js` está registrado.

Notas sobre preload/preconnect
- Foi adicionado `preconnect` para `cdnjs.cloudflare.com` e `preload` para o CSS local e para o `boll.gif` (hero) para priorizar carregamento inicial do hero sem esconder outros recursos.

