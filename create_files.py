import json
import os

# Criar index.html
with open('index.html', 'w') as f:
    f.write('''<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/emoji-favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pomopetz - Pomodoro com Pets</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
''')

# Criar .gitignore
with open('.gitignore', 'w') as f:
    f.write('''# Node modules
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
''')

# Criar main.js
with open('src/main.js', 'w') as f:
    f.write("""import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.scss'

const app = createApp(App)
app.mount('#app')
""")

print("✅ Arquivos base criados com sucesso!")
