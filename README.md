# 📦 Projeto Catálogo de Produtos Robustec

> Sistema web de catálogo de produtos para a Robustec LTDA, especializada em pés de apoio.

---

## 📋 Descrição do Projeto

O **Catálogo de Produtos Robustec** é uma aplicação web moderna desenvolvida para gerenciar e exibir o portfólio de produtos da empresa Robustec. O sistema oferece três interfaces principais:

### 🌐 **Interface Pública (Catálogo)**
- Visualização de produtos ativos com imagens, especificações técnicas e descrições
- Sistema de filtros avançados (por tipo de bucha, acionamento e base)
- Busca por código de produto
- Design responsivo para mobile, tablet e desktop
- Carrossel de imagens para cada produto
- Detalhes completos dos produtos em modal
- Integração com WhatsApp para contato direto

### 🔐 **Interface Administrativa**
- CRUD completo de produtos (Criar, Visualizar, Atualizar, Deletar)
- Upload e gerenciamento de múltiplas imagens por produto
- Sistema de logs detalhado de todas as operações
- Gerenciamento de usuários e permissões
- Controle de componentes (buchas, acionamentos, bases)
- Autenticação JWT com níveis de acesso

### 👤 **Interface Comercial**
- CRUD completo de usuários (Criar, Visualizar, Atualizar e Deletar)
- Gerenciamento de usuários e permissões
- Visualização da tela de cliente
- Autenticação JWT com níveis de acesso

### 🛠️ **Tecnologias Utilizadas**
- **Vue 3** com Composition API e `<script setup>`
- **TypeScript** para tipagem estática
- **Vite** como build tool
- **Tailwind CSS** para estilização
- **Vue Router** para roteamento
- **Axios** para requisições HTTP
- Integração com APIs RESTful

---

## ⚙️ Requisitos para Rodar Localmente

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 16.x ou superior)
- **npm** (versão 7.x ou superior)
- **Git** (para clonar o repositório)

---

## 🚀 Passos para Rodar Localmente

### 1️⃣ Clone o repositório

```bash
git clone <https://github.com/Flood-project/frontend-flood.git>
cd frontend-flood
```

### 2️⃣ Configure a branch correta (se necessário)

```bash
git checkout develop
```

### 3️⃣ Atualize o repositório

```bash
git pull origin develop
```

### 4️⃣ Instale as dependências

```bash
npm install
```

### 5️⃣ Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto

Edite o arquivo `.env` com as configurações corretas:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 6️⃣ Inicie o servidor de desenvolvimento

```bash
npm run dev
```


### 7️⃣ Acesse a aplicação

Abra seu navegador e acesse:

```
http://localhost:5173
```

---

## 📂 Estrutura do Projeto (Tree Structure)

```
📁frontend-flood
|   .env
|   .gitignore
|   index.html
|   package-lock.json
|   package.json
|   README.md
|   tailwind.config.js
|   tsconfig.app.json
|   tsconfig.json
|   tsconfig.node.json
|   vite.config.ts
|   
+---📁.vscode
|       extensions.json
|       
+---📁imgstorage # Guarda as imagens das logomarcas utilizadas no projeto
|   +---📁logo
|   |   logorobusteccinza.png
|   |   robustec.jpg
|   |   robusteclogo.png
|  
| 
|           
+---📁public
|       vite.svg
|       
\---📁src # Guarda tudo relacionado a parte lógica do projeto -> Conexões com API's, entidades, etc.
    |   App.vue
    |   main.ts
    |   shims-vue.d.ts
    |   style.css
    |   Usuariologado.vue
    |   vite-env.d.ts
    |   
    +---📁modules # Somente guarda as entidades, repositórios, regras de negócio
    |   +---📁acionamento 
    |   |   +---📁domain
    |   |   |       acionamento_domain.ts
    |   |   |       
    |   |   \---📁repository
    |   |           acionamento_repository.ts
    |   |           
    |   +---📁base
    |   |   +---📁domain
    |   |   |       base_domain.ts
    |   |   |       
    |   |   \---📁repository
    |   |           base_repository.ts
    |   |           
    |   +---📁bucha
    |   |   +---📁domain
    |   |   |       bucha_domain.ts
    |   |   |       
    |   |   \---📁repository
    |   |           bucha_repository.ts
    |   |           
    |   +---📁catalog # Todas as informações, entidades, repositórios, etc relacionadas ao catálogo principal
    |   |   +---📁domain
    |   |   |   |   acionamento.ts
    |   |   |   |   base.ts
    |   |   |   |   bucha.ts
    |   |   |   |   file.ts
    |   |   |   |   product.ts
    |   |   |   |   productWithComponents.ts
    |   |   |   |   
    |   |   |   \---📁admin
    |   |   |           audit.ts
    |   |   |           
    |   |   +---📁repository
    |   |   |   |   acionamento_repository.ts
    |   |   |   |   base_repository.ts
    |   |   |   |   bucha_repository.ts
    |   |   |   |   object_store.ts
    |   |   |   |   product_repository.ts
    |   |   |   |   
    |   |   |   \---📁admin
    |   |   |           audit_logs_repository.ts
    |   |   |           
    |   |   +---📁usecase
    |   |   |       product_usecase.ts
    |   |   |       
    |   |   \---📁view # HTML e código fontes das páginas utilizadas no projeto
    |   |       | 
    |   |       |   home_catalog.vue # Página de catálogo de usuário normal, visualização e filtro dos produtos 
    |   |       |
    |   |       |   
    |   |       \---📁admin
    |   |               acionamentos_page.vue # Página de listagem e cadastro de acionamentos
    |   |               admin_catalog.vue  # Página de catálogo admin, painel de monitoramento para cadastros, edição e exclusão 
    |   |                     de produtos e relacionados.
    |   |               bases_page.vue  # Página de listagem e cadastro de bases
    |   |               buchas_page.vue  # Página de listagem e cadastro de buchas
    |   |               logs_page.vue  # Página de listagem e registro de logs (registros de todas as operações do sistema)
    |   |               
    |   +---📁login # Estrutura e lógica relacionada ao login de usuários
    |   |   +---📁domain
    |   |   |       login.ts
    |   |   |       login_response.ts
    |   |   |       
    |   |   +---📁repository
    |   |   |       login_repository.ts
    |   |   |       
    |   |   +---📁usecase
    |   |   |       login_usecase.ts
    |   |   |       
    |   |   \---📁view # Telas de login e de redefinição de senha
    |   |           forgot_password.vue
    |   |           logintest_page.vue
    |   |           login_page.vue
    |   |           
    |   +---📁object_store
    |   |   +---📁domain
    |   |   |       object_store.ts
    |   |   |       
    |   |   \---📁repository
    |   |           object_store_repository.ts
    |   |           
    |   +---📁user
    |   |   +---📁domain
    |   |   |       user.ts
    |   |   |       user_group.ts
    |   |   |       
    |   |   +---📁repository
    |   |   |       user_group_repository.ts
    |   |   |       user_repository.ts
    |   |   |       
    |   |   \---📁view # Página de administração de usuários. Cadastrar, editar e excluir usuários
    |   |           user_page.vue
    |   |           
    |   \---📁users
    |       \---views
    |               register_user.vue
    |               
    +---📁router
    |       index.ts
    |       
    +---📁services
    |       axios.ts
    |       jwt_decoder.ts
    |       token.ts
    |       
    \---📁types
            js-query-pagination.d.ts         
---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Gera build de produção
npm run preview          # Preview da build de produção

# Linting e Formatação
npm run lint             # Verifica problemas no código
npm run format           # Formata o código
```

---

## 📞 Suporte

-Documentação e testes -> Jailopesoutlook@gmail.com
-Backend e testes -> apspolti@gmail.com
-Frontend e testes -> eduardoosartori@gmail.com

---

## 🗺️ Roadmap

Vários tópicos ainda restam para serem tratados, como:

- Paginação de Usuários, Componentes e Auditoria;
- Melhorias gerais de UX e validações no front e back;
- Pesquisa de produtos por nome personalizado;
- Filtros de auditoria e pesquisa por usuário/produto alterado e responsável pela alteração;
- Ajustar armazenamento das imagens e edição das imagens. Quando usuário for editar, que mostre a imagem atual e permita subsituí-la;
- Adicionar histórico de eventos nos usuários e produtos (logs diretamente em cada produto ou usuário separadamente, sem necessidade de ver todos os logs);
- Adicionar tipos de categorias de produtos diferentes;
- Permitir criar tipos de usuário e permissões personalizadas;
- Melhorar retornos de auditoria, mostrando exatamente o que havia antes e o que restou depois de alterações;
- Otimizar código visando velocidade;
- Redefinição de senha de usuários via e-mail
- E muito mais....

---

## 👥 Autores

-Documentação e testes -> Jailopesoutlook@gmail.com e 
danielsoranco@cesurg.com
-Backend e testes -> apspolti@gmail.com
-Frontend e testes -> eduardoosartori@gmail.com

---

## 📄 Licença

**Proprietária** - Todos os direitos reservados © Robustec Indústria e Comércio Ltda

Este projeto é de propriedade exclusiva da Robustec LTDA. Nenhuma parte deste software pode ser reproduzida, distribuída ou transmitida de qualquer forma ou por qualquer meio sem a permissão prévia por escrito da Robustec LTDA.

---

## 📊 Status do Projeto

🟢 **Em Desenvolvimento Ativo**

- ✅ Primeira versão do catálogo concluída
- ✅ Sistema administrativo funcional
- ✅ Autenticação e autorização implementadas
- ✅ Sistema de logs operacional
- 🔄 Melhorias contínuas e novas funcionalidades em andamento

---

## 🌟 Funcionalidades Principais

### ✨ Catálogo Público
- [x] Listagem de produtos com paginação
- [x] Filtros por componentes (bucha, acionamento, base)
- [x] Busca por código de produto
- [x] Visualização de detalhes com múltiplas imagens
- [x] Design responsivo (mobile-first)
- [x] Integração com WhatsApp

### 🔐 Área Administrativa
- [x] CRUD completo de produtos - Criar, Alterar, Excluir e Visualizar
- [x] Upload de múltiplas imagens
- [x] Sistema de logs detalhado
- [x] Gerenciamento de usuários
- [x] Controle de componentes - Buchas, Acionamentos e Bases
- [x] Autenticação JWT

---

**Desenvolvido com ❤️ para a equipe Robustec**