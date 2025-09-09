# Documentação do Projeto My Library

## Visão Geral
My Library é um sistema de gerenciamento de biblioteca pessoal desenvolvido com Next.js, projetado para ajudar os usuários a organizar e acompanhar suas coleções de livros, séries e outros itens literários. A aplicação oferece uma interface intuitiva para adicionar, visualizar, atualizar e remover itens da coleção pessoal do usuário.

## Objetivo
O principal objetivo deste projeto é fornecer uma solução completa para entusiastas de leitura que desejam gerenciar suas coleções literárias de forma organizada e acessível. O sistema permite o acompanhamento de livros individuais, séries, e suas relações, além de oferecer recursos para classificação e busca.

## Funcionalidades Principais

### 1. Gerenciamento de Livros
- Cadastro de livros com informações como título, autor, gênero, etc.
- Atualização de informações dos livros
- Visualização detalhada de cada livro
- Remoção de livros da coleção

### 2. Gerenciamento de Séries
- Cadastro de séries literárias
- Associação de livros a séries
- Acompanhamento do progresso nas séries
- Visualização de séries completas e em andamento

### 3. Gerenciamento de Coleções
- Criação de coleções personalizadas
- Adição de itens (livros, sérires e itens da wishlist) a múltiplas coleções

### 4. Gerenciamento de Wishlist
- Adição de livros à lista de desejos
- Organização através da relação wishlist e coleção

### 5. Gerenciamento de Citações
- Salvar citações favoritas dos livros
- Associação de citações a livros específicos
- Marcação de páginas e localizações

### 6. Relacionamentos entre Entidades
- Livros podem pertencer a uma série
- Livros podem pertencer a várias coleções
- Livros podem conter várias citações
- Séries podem conter múltiplos livros
- Séries podem pertencer a várias coleções
- Coleções podem conter tanto livros individuais, séries e livros da wishlist
- Citações são vinculadas a livros específicos

## Arquitetura do Sistema

### Requisitos do Sistema

#### Requisitos Funcionais

1. **Gerenciamento de Conteúdo**
   - CRUD completo para livros, séries e coleções e citações.
   - Upload e armazenamento de capas de livros.
   - Importação/exportação de dados.

2. **Controle e Organização**
   - Evitar duplicação de registros pelo mesmo identificador único.
   - Registrar status de leitura (não iniciado, lendo, concluído).
   - Controlar progresso de leitura por página ou percentual.
   - Gerenciar datas de aquisição, início e conclusão de leitura.
   - Registrar avaliação de leitura.

3. **Busca e Filtragem**
   - Busca por livros, séries e coleções.
   - Filtragem por gênero, autor, status de leitura, etc.
   - Ordenação por título, autor, data de publicação, etc.

### Regras de Negócio

1. **Gestão de Livros**
   - Um livro deve ter título e autor obrigatórios.
   - ISBN deve ser único por livro.
   - Status de leitura: Não lido, Lendo, Lido, Abandonado.
   - Sistema de avaliação de 1 a 5 estrelas.
   - Datas de leitura não podem ser futuras.
   - Campo “Data de aquisição” só deve aparecer se “Tenho na estante” for true
   - Campo “Data de Início da Leitura” só deve aparecer se status for Lendo, Finalizado ou Abandonado.
   - Campo “Página atual” só deve aparecer se status for Lendo.
   - Campo “Releitura” só deve aparecer se status for Lendo.
   - Campo "Número da Releitura" só deve aparecer se "Releitura" for true.
   - Campo “Data finalização da Leitura” só deve aparecer se status for Finalizado ou Abandonado.
   - Campo “Avaliação” só deve aparecer se status for Finalizado.

2. **Séries**
   - Série pode conter múltiplos livros.
   - Progresso automático em séries baseado nos livros lidos e quantidade total de livros que pertencem à série.
   - Status de leitura: Não lido, Lendo, Lido, Abandonado.
   - Sistema de avaliação de 1 a 5 estrelas.
   - Datas de leitura não podem ser futuras.
   - Campo “Data de Início da Leitura” só deve aparecer se status for Lendo, Finalizado ou Abandonado.
   - Campo “livro atual” só deve aparecer se status for Lendo.
   - Campo “Data finalização da Leitura” só deve aparecer se status for Finalizado ou Abandonado.
   - Campo “Avaliação” só deve aparecer se status for Finalizado.
   - Campo "Coleção completa" indica que o usuário possui todos os livros da série.

3. **Coleções**
   - Livros, séries e livros da wishlist podem pertencer a múltiplas coleções.
   - Uma mesma coleção pode conter livros, séries e livros da wishlist simultaneamente.

4. **Wishlist**
   - Livros podem ser adicionados à wishlist pelo seu ID.

5. **Citações**
   - Cada citação deve estar vinculada a um único livro (não pode pertencer a mais de um).
   - A vinculação da citação ao livro deve ser feita pelo ID do livro.
   - A citação deve conter o texto da citação e a página.

### Padrões de Projeto

1. **Frontend**
   - Componentes funcionais com React Hooks
   - Gerenciamento de estado com React Query
   - Estilização com Tailwind CSS
   - Formulários com React Hook Form
   - Roteamento com Next.js

2. **Backend (Supabase)**
   - Banco de dados relacional PostgreSQL
   - Armazenamento de arquivos

### Fluxos Principais

1. **Adição de Novo Livro**  
   O usuário preenche o formulário → dados são validados → API processa a requisição → registro é salvo no banco de dados → estado da aplicação é atualizado → feedback é exibido para o usuário.

2. **Registro de Leitura**  
   O usuário seleciona o livro → atualiza o status e páginas lidas → sistema calcula o progresso automaticamente → atualiza informações das séries relacionadas.

### Estrutura do Projeto

A organização do código segue uma arquitetura baseada em componentes e funcionalidades, conforme detalhado abaixo:

```
src/
├── actions/
├── app/
│   ├── book/
│   ├── collection/
│   ├── quote/
│   ├── serie/
│   └── wishlist/
├── components/
│   ├── BookCard/
│   ├── CollectionCard/
│   ├── ConfirmationPopUp/
│   ├── Create/
│   ├── DetailsPage/
│   ├── EmptyTable/
│   ├── FormFields/
│   ├── Icons/
│   ├── Read/
│   ├── ReturnBtn/
│   ├── SideMenu/
│   └── Update/
├── services/
├── styles/
├── utils/

```

### Decisões de Arquitetura

1. **Frontend**
   - Next.js para renderização híbrida (SSG/SSR)
   - Separação clara entre lógica de apresentação e negócios
   - Componentes funcionais com TypeScript para segurança de tipos

2. **Backend**
   - Supabase como BaaS (Backend as a Service)
   - Row Level Security para controle de acesso granular
   - Funções serverless para lógica de negócios complexa

### Monitoramento e Logs

1. **Frontend**
   - Logging de erros com Sentry
   - Analytics de uso
   - Monitoramento de performance

2. **Backend**
   - Logs de auditoria
   - Monitoramento de queries
   - Alertas de erro

### Melhorias Futuras

1. **Escalabilidade**
   - Cache distribuído
   - CDN para assets estáticos
   - Otimização de queries

2. **Funcionalidades**
   - Compartilhamento social
   - Análise de hábitos de leitura
   - Recomendações personalizadas
   - Sincronização entre dispositivos

### Diretórios Principais

- **/components/Book**: Implementa toda a lógica de exibição e manipulação de livros
- **/components/Serie**: Gerencia a exibição e organização de séries literárias
- **/components/Collection**: Lida com a criação e gerenciamento de coleções
- **/components/Update**: Contém formulários e lógica para atualização de itens
- **/components/Read**: Componentes dedicados à visualização de conteúdo
- **/components/DetailsPage**: Páginas detalhadas para cada entidade do sistema

## Como Usar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase (para autenticação e banco de dados)

### Instalação
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```
3. Configure as variáveis de ambiente (crie um arquivo `.env.local` baseado no `.env.example`)
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
5. Acesse `http://localhost:3000` no navegador

## Modelo de Dados e Relacionamentos

### Tabelas Principais

1. **books**
   - `id` (uuid, PK): Identificador único do livro
   - `created_at` (timestamp): Data de criação
   - `title` (text): Título do livro
   - `author` (text): Autor do livro
   - `cover` (text): URL da capa
   - `is_single_book` (boolean): Livro individual
   - `serie_id` (uuid, FK → series.id): Série do livro
   - `volume` (integer): Volume do livro
   - `category` (text): Categoria do livro
   - `pages` (integer): Número de páginas
   - `language` (text): Idioma do livro
   - `library` (boolean): Livro na estante
   - `acquisition_date` (date): Data de aquisição
   - `init_date` (date): Data de início da leitura
   - `finish_date` (date): Data de finalização da leitura
   - `current_page` (integer): Página atual
   - `status` (enum): 'tbr', 'reading', 'finish', 'abandoned'
   - `rating` (integer): Avaliação de 1 a 5
   - `comments` (text): Comentários
   - `version` (integer): Versão do livro
   - `slug` (text): Slug do livro
   - `rereaded` (integer): Número de releituras

2. **series**
   - `id` (uuid, PK): Identificador único da série
   - `created_at` (timestamp): Data de criação
   - `serie_name` (text): Nome da série
   - `qty_volumes` (integer): Quantidade de volumes
   - `collection_complete` (boolean): Coleção completa
   - `status` (enum): 'tbr', 'reading', 'finish', 'abandoned'
   - `current_book_id` (uuid, FK → books.id): Livro atual
   - `init_date` (date): Data de início da leitura
   - `finish_date` (date): Data de finalização da leitura
   - `rating` (integer): Avaliação de 1 a 5
   - `slug` (text): Slug da série

3. **collections**
   - `id` (uuid, PK): Identificador único da coleção
   - `created_at` (timestamp): Data de criação
   - `collection_name` (text): Nome da coleção
   - `init_date` (date): Data de início da coleção
   - `finish_date` (date): Data de finalização da coleção
   - `description` (text): Descrição da coleção
   - `status` (enum): 'current', 'finish', 'abandoned'
   - `type_collection` (integer): Tipo de coleção
   - `slug` (text): Slug da coleção

4. **quotes**
   - `id` (uuid, PK): Identificador único da citação
   - `created_at` (timestamp): Data de criação
   - `quote` (text): Texto da citação
   - `book_id` (uuid, FK → books.id): Livro relacionado
   - `page` (integer): Número da página
   - `slug` (text): Slug da citação

5. **wishlist**
   - `id` (uuid, PK): Identificador único do item
   - `created_at` (timestamp): Data de criação
   - `book_id` (uuid, FK → books.id): Livro relacionado

### Tabelas de Relacionamento

1. **collections_book** (N:N entre books e collections)
   - `id` (uuid, PK)
   - `created_at` (timestamp)
   - `book_id` (uuid, FK → books.id)
   - `collection_id` (uuid, FK → collections.id)
   - UNIQUE(book_id, collection_id)

2. **collection_serie** (N:N entre series e collections)
   - `id` (uuid, PK)
   - `created_at` (timestamp)
   - `serie_id` (uuid, FK → series.id)
   - `collection_id` (uuid, FK → collections.id)
   - UNIQUE(serie_id, collection_id)

3. **collections_wishlist** (N:N entre wishlist e collections)
   - `id` (uuid, PK)
   - `created_at` (timestamp)
   - `wishlist_id` (uuid, FK → wishlist.id)
   - `collection_id` (uuid, FK → collections.id)
   - UNIQUE(wishlist_id, collection_id)

### Regras de Relacionamento

1. **Livro**
   - Um livro pode pertencer a uma série (N:1 via books_series)
   - Um livro pode estar em várias coleções (N:M via books_collections)
   - Um livro pode ter muitas citações (1:N)

2. **Série**
   - Uma série pode conter vários livros (1:N via books_series)
   - Uma série pode estar em várias coleções (N:M via series_collections)

3. **Coleção**
   - Uma coleção pode conter vários livros (N:M via books_collections)
   - Uma coleção pode conter várias séries (N:M via series_collections)

4. **Citação**
   - Uma citação pertence a um livro (N:1)

5. **Wishlist**
   - Um livro pode pertencer a uma wishlist (N:1)

### Restrições de Integridade

#### Regras Gerais

- Todas as chaves estrangeiras possuem **`ON DELETE CASCADE`**, garantindo que a exclusão de um registro referenciado remova automaticamente os registros relacionados.  
- Campos obrigatórios estão definidos como **`NOT NULL`**, assegurando a presença de dados essenciais.  
- Índices foram criados em campos frequentemente usados em buscas, como **título**, **autor** e **categoria**, para melhorar a performance das consultas.  
- Restrições **UNIQUE** foram aplicadas para evitar duplicação de registros em colunas que exigem valores únicos.

#### Restrições Específicas por Tabela

1. **Tabela quote**
   - **Chave estrangeira:** `quote_book_id_fkey`  
   - **Referência:** `public.book(id)` via coluna `book_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** SET NULL  

2. **Tabela serie**
   - **Chave estrangeira:** `serie_current_book_id_fkey`  
   - **Referência:** `public.book(id)` via coluna `current_book_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** SET NULL  

3. **Tabela wishlist**
   - **Chave estrangeira:** `wishlist_book_id_fkey`  
   - **Referência:** `public.book(id)` via coluna `book_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

4. **Tabela book**
   - **Chave estrangeira:** `book_serie_id_fkey`  
   - **Referência:** `public.serie(id)` via coluna `serie_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

5. **Tabela collection_book**
   - **Chave estrangeira:** `collection_book_book_id_fkey`  
   - **Referência:** `public.book(id)` via coluna `book_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

   - **Chave estrangeira:** `collection_book_collection_id_fkey`  
   - **Referência:** `public.collection(id)` via coluna `collection_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

6. **Tabela collection_serie**
   - **Chave estrangeira:** `collection_serie_serie_id_fkey`  
   - **Referência:** `public.serie(id)` via coluna `serie_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

   - **Chave estrangeira:** `collection_serie_collection_id_fkey`  
   - **Referência:** `public.collection(id)` via coluna `collection_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

7. **Tabela collection_wishlist**
   - **Chave estrangeira:** `collection_wishlist_wishlist_id_fkey`  
   - **Referência:** `public.wishlist(id)` via coluna `wishlist_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

   - **Chave estrangeira:** `collection_wishlist_collection_id_fkey`  
   - **Referência:** `public.collection(id)` via coluna `collection_id`  
   - **Ação no update:** CASCADE  
   - **Ação no delete:** CASCADE  

## Tecnologias Utilizadas
- Next.js (Framework React)
- TypeScript (Tipagem estática)
- Supabase (Backend como Serviço)
- Tailwind CSS (Estilização)



--------------------------------------------------------------

# My Library – Project Documentation

## 1. Overview

**My Library** is a personal library management system developed with **Next.js**, which allows organizing and tracking collections of books, series, and literary items.  
The system provides features to add, view, update, and remove items, track reading progress, and manage collections and quotes.

## 2. Objective

Provide a complete solution for reading enthusiasts who want to keep their literary collections organized, with features for search, classification, reading progress, and relationships between books, series, and collections.

## 3. Main Features

### 3.1 Books
- Full CRUD (Add, View, Update, Remove)  
- Information: title, author, genre, ISBN, language, cover  
- Reading control: status, pages read, rating, start/finish dates  
- Conditional field display rules (e.g., `current_page` only appears if status = Reading)  

### 3.2 Series
- Series registration  
- Association of books to series  
- Automatic status and progress based on the books in the series  
- Rating and reading dates  

### 3.3 Collections
- Creation of custom collections  
- Inclusion of books, series, and wishlist items  
- Support for multiple collections per item  

### 3.4 Wishlist
- Add desired books  
- Organization through collections  

### 3.5 Quotes
- Save favorite quotes  
- Link to a single book  
- Record page and quote text  

### 3.6 Relationships
- Books can belong to series and collections, and contain multiple quotes  
- Series can contain multiple books and belong to multiple collections  
- Collections can contain books, series, and wishlist items  
- Quotes linked to books  
- Wishlist contains books  

## 4. System Architecture

### 4.1 Functional Requirements
- Full CRUD for all entities  
- Upload and storage of covers  
- Import/export data  
- Reading status and progress  
- Search, filtering, and sorting  

### 4.2 Business Rules (Summary)
- **Book:** required title and author, unique ISBN, reading status, and rating 1–5 stars  
- **Series:** progress based on read books, status, and rating  
- **Collection:** supports books, series, and wishlist  
- **Quotes:** linked to a single book  
- **Wishlist:** books added by ID  

### 4.3 Design Patterns
- **Frontend:** React Hooks, React Query, Tailwind CSS, React Hook Form, Next.js (SSG/SSR)  
- **Backend (Supabase):** PostgreSQL, Row Level Security, Serverless functions  

### 4.4 Main Flows
- **Add Book** → Validation → API → Save to DB → Update state → User feedback  
- **Reading Log** → Update status/pages → Calculate series progress → Update data  

## 5. Project Structure

src/
├── actions/
├── app/
│ ├── book/
│ ├── collection/
│ ├── quote/
│ ├── serie/
│ └── wishlist/
├── components/
│ ├── BookCard/
│ ├── CollectionCard/
│ ├── ConfirmationPopUp/
│ ├── Create/
│ ├── DetailsPage/
│ ├── EmptyTable/
│ ├── FormFields/
│ ├── Icons/
│ ├── Read/
│ ├── ReturnBtn/
│ ├── SideMenu/
│ └── Update/
├── services/
├── styles/
└── utils/

## 6. Data Model

### 6.1 Main Tables

| Table       | Key Fields |
|------------|----------------|
| **books**    | id, title, author, isbn, status, rating, pages, current_page, serie_id, acquisition_date |
| **series**   | id, serie_name, qty_volumes, status, current_book_id, rating, collection_complete |
| **collections** | id, collection_name, status, type_collection |
| **quotes**   | id, quote, book_id, page |
| **wishlist** | id, book_id |

### 6.2 Relationship Tables (N:M)
- `collections_book` → books ↔ collections  
- `collection_serie` → series ↔ collections  
- `collections_wishlist` → wishlist ↔ collections  

### 6.3 Integrity Rules
- **ON DELETE CASCADE** on FKs to prevent orphan records  
- Required fields → **NOT NULL**  
- Indexes on title, author, category  
- **UNIQUE** constraints where necessary (e.g., ISBN, book-collection combinations)  

## 7. Technologies Used
- **Next.js** – React framework (SSG/SSR)  
- **TypeScript** – Static typing  
- **Supabase** – Backend as a Service, PostgreSQL  
- **Tailwind CSS** – Styling  

## 8. How to Use

### Prerequisites
- Node.js ≥ 18  
- npm or yarn  
- Supabase account