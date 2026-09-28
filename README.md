# 🍅 Pomopetz - Pomodoro com Pets

Uma aplicação web gamificada que combina a técnica Pomodoro com um sistema de pets virtuais para aumentar a produtividade.

## 🎮 Características

### Timer Pomodoro
- **Foco**: 25 minutos de trabalho concentrado
- **Pausa Curta**: 5 minutos para descanso rápido
- **Pausa Longa**: 15 minutos para descanso maior
- Controles: Iniciar, Pausar, Resetar e Pular
- Feedback visual no título da aba do navegador

### Sistema de Recompensas
- **Moedas**: Ganhe moedas ao completar ciclos de foco
- **Pets da Loja**: Compre pets com moedas virtuais
- **Pets de Ofensiva**: Desbloqueie pets exclusivos mantendo uma sequência diária
- **Pets de Excursão**: Envie seus pets em missões para ganhar recompensas

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Estilos**: SCSS Puro
- **Persistência**: localStorage

## 📁 Estrutura

```
pomopetz/
├── src/
│   ├── components/     # Componentes Vue
│   ├── composables/    # Lógica reutilizável
│   ├── styles/        # Estilos SCSS
│   ├── App.vue        # Layout principal
│   └── main.js        # Entry point
├── package.json
└── vite.config.js
```

## 🚀 Como Começar

```bash
npm install
npm run dev
```

Visite `http://localhost:5173`

## 📝 Composables

- **usePomodoro()**: Timer do Pomodoro
- **useRewards()**: Moedas e pets da loja
- **useStreak()**: Ofensiva diária
- **useExcursion()**: Missões dos pets
- **useDataMigration()**: Versionamento de dados

## 🎨 Customização de Estilos

Edite `src/styles/variables.scss` para mudar cores, espaçamento, tipografia, etc.

Os mixins em `src/styles/mixins.scss` facilitam responsividade e componentes comuns.

## 📊 Pets Disponíveis

**Loja**: 6 pets (Pikachu, Bulbassauro, Blastoise, Charizard, Dragonite, Mewtwo)

**Ofensiva**: 5 pets (Ninetales, Arcanine, Moltres, Ho-Oh, Lugia)

**Excursão**: 7 pets de 4 regiões diferentes

## 🔧 Desenvolvimento

Para limpar todos os dados:
```javascript
import { useDataMigration } from '@/composables/useDataMigration'
const migration = useDataMigration()
migration.clearAllData()
```

---

**Dica**: Mantenha seu streak! 🔥 Complete pelo menos um ciclo de foco por dia!
