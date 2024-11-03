# Como começar

Para começar o servidor precisará rodar alguns comandos

1. Clonar o repositório

```bash
git clone github.com/RodrigoScola/backend_server
```

2. Instalar as dependências

```bash
npm install
```

3. Começar o servidor

```bash
npm run dev
```

# Testes

Para ter certeza que o servidor funcione e processe os requests, utilizamos testes automatizados. Para isso, execute o comando

```bash
npm run test
```

# Documentação

Para ver as rotas e o que seria necessário delas, vá para a pagina http://localhost:3000/docs para ver as rotas disponiveis

## Como faço para filtrar dados nos pedidos?

Para filtrar dados como por exemlo: Pegar eventos apenas de certas categorias, utilizamos o `query` nos pedidos (https://en.wikipedia.org/wiki/Query_string)

Então se quiser algo específico, basta colocar no url!

### Exemplos

Para receber uma quantidade maior de itens

```bash
curl -X 'GET' \
  'http://localhost:3000/categorias/?limit=100' \
  -H 'accept: application/json'
```

Para pegar com `offset`

```bash
curl -X 'GET' \
  'http://localhost:3000/categorias/?offset=100' \
  -H 'accept: application/json'
```

Selecionar todos os itens possuem status de inativos

```bash
curl -X 'GET' \
  'http://localhost:3000/categorias/?status=2' \
  -H 'accept: application/json'
```

Selecionar todos os itens que possuem as categorias 1 , 2 , 3

```bash
curl -X 'GET' \
  'http://localhost:3000/usuarios/?categoria=1&categoria=2&categoria=3' \
  -H 'accept: application/json'
```

Para ordenar itens é necessário dizer qual coluna é para ordenar e em qual ordem

```bash
curl -X 'GET' \
  'http://localhost:3000/usuarios/?order=desc&orderBy=categorias' \
  -H 'accept: application/json'
```
