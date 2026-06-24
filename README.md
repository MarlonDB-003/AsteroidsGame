# 🚀 Space Impact

Recriação do clássico **Space Impact** — a "navezinha" que vinha nos celulares
Nokia (o famoso *tijolão*) — feita em **JavaScript puro + HTML5 Canvas**, com aquele
visual de **LCD verde monocromático**.

Sem frameworks, sem build, sem instalação: é só abrir no navegador.

## ▶️ Como jogar

Dê **duplo-clique em `index.html`** (ou arraste pro navegador). Pronto.

| Ação | Teclado | Celular |
|------|---------|---------|
| Mover | `↑ ↓ ← →` | arraste o dedo ou use o D-pad |
| Atirar | `Espaço` | botão **FOGO** / tocar na tela |
| Começar / Continuar | `Enter` | tocar na tela |
| Pausar | `P` | — |
| Ligar/desligar som | `M` | — |

**Objetivo:** sobreviva às ondas de inimigos, derrote o chefão de cada fase e
chegue ao fim das 5 fases. Seu recorde fica salvo no navegador.

## 🎮 Recursos

- 3 tipos de inimigos (reto, em onda, atirador) + chefões com barra de vida
- Efeitos sonoros 8-bit gerados em tempo real (Web Audio API — sem arquivos)
- *Game feel*: tremor de tela, flash de impacto, explosões em partículas
- Recorde persistente (localStorage)
- Controles de toque para celular + D-pad na tela
- Telas de menu, pausa, game over e vitória

## 📁 Estrutura

```
.
├── index.html          # estrutura da página
├── css/
│   └── style.css       # visual do "celular" e da tela
└── js/
    ├── config.js       # constantes / balanceamento
    ├── utils.js        # funções auxiliares (clamp, colisão, storage)
    ├── audio.js        # efeitos sonoros (Web Audio API)
    ├── input.js        # teclado + toque + botões
    ├── entities.js     # Player, Enemy, Boss, Bullet, Particle, StarField
    ├── game.js         # loop, estados, colisões e telas
    └── main.js         # ponto de entrada
```

Cada arquivo registra-se no namespace global `SI` e é carregado em ordem pelo
`index.html`. Foi feito assim de propósito, para **rodar abrindo o arquivo
direto** (sem servidor). Para evoluir o projeto, dá pra migrar para ES Modules +
[Vite](https://vitejs.dev) reaproveitando a mesma divisão de arquivos.

## 🛠️ Quer mexer?

Quase todo o balanceamento (vida, velocidade, cadência de tiro, dificuldade das
fases) está em [`js/config.js`](js/config.js). Mude os números e recarregue a
página.

---

Feito por diversão e nostalgia. 🎵 *bip bip*
