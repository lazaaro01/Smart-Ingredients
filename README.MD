# Smart Ingredients

## Visão Geral

Smart Ingredients é um protótipo de aplicação web para gerenciamento de ingredientes culinários, com sugestões de receitas e substituições via IA. Permite cadastrar, editar, remover e pesquisar ingredientes, além de gerar receitas e alternativas usando uma API de inteligência artificial.

## Funcionalidades

- Cadastro, edição e remoção de ingredientes.
- Pesquisa por nome ou tags.
- Sugestão de receitas e substituições de ingredientes via IA.
- Interface web responsiva com Bootstrap.

## Instalação

1. **Pré-requisitos**  
   - Node.js >= 16
   - npm

2. **Clone o repositório**  
   ```sh
   git clone https://github.com/lazaaro01/Smart-Ingredients
   cd Smart-Ingredients
   ```

3. **Instale as dependências**  
   ```sh
   npm install
   ```

4. **Configure variáveis de ambiente**  
   Crie um arquivo `.env` na raiz com:
   ```
   GROQ_API_KEY=seu_token_groq
   PORT=3000
   ```

5. **Inicie o servidor**  
   ```sh
   npm start
   ```
   Ou para desenvolvimento com auto-reload:
   ```sh
   npm run dev
   ```

6. **Acesse a aplicação**  
   Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Estrutura de Arquivos

```
.env                # Variáveis de ambiente (não versionado)
.gitignore          # Ignora node_modules e .env
package.json        # Configuração do projeto Node.js
server.js           # Backend Express/API
public/
  ├── app.js        # Lógica frontend JS
  ├── index.html    # Interface web
  └── style.css     # Estilos customizados
```

## API

### Ingredientes

- `GET /api/ingredients?q=`  
  Lista ingredientes, opcionalmente filtrando por nome/tag.

- `GET /api/ingredients/:id`  
  Busca ingrediente por ID.

- `POST /api/ingredients`  
  Cria novo ingrediente.  
  Corpo: `{ name, amount, tags }`

- `PUT /api/ingredients/:id`  
  Atualiza ingrediente.  
  Corpo: `{ name?, amount?, tags? }`

- `DELETE /api/ingredients/:id`  
  Remove ingrediente.

### Sugestão IA

- `POST /api/ai/suggest`  
  Gera receitas e substituições via IA.  
  Corpo: `{ ingredientNames: [ "Tomate", ... ] }`  
  Resposta:  
  ```json
  {
    "ok": true,
    "result": {
      "recipes": [
        {
          "name": "Receita",
          "ingredients": ["..."],
          "steps": ["..."],
          "vegan": true,
          "gluten_free": false
        }
      ],
      "substitutions": {
        "Queijo Mussarela": "Queijo Vegano"
      }
    }
  }
  ```

## Detalhes Técnicos

- Backend: `server.js` com Express, CORS, dotenv, integração Groq API via axios.
- Frontend: `public/app.js` manipula DOM, faz requisições à API, renderiza cards e modais.
- Interface: `public/index.html` usa Bootstrap 5.
- Estilos: `public/style.css`.

## Licença

ISC

---

Para dúvidas ou sugestões, abra uma issue ou envie PR!