# EGOIST SYSTEM

Sistema de gerenciamento de jogadores e times inspirado em Blue Lock.

## Requisitos
- Node.js 20 ou superior
- Projeto no Supabase

## Instalação
1. Extraia o ZIP.
2. Abra a pasta `egoist-system` no VS Code.
3. No terminal do VS Code, execute `npm install`.
4. Copie `.env.example` e renomeie a cópia para `.env`.
5. Preencha as duas variáveis do `.env` com a URL base do Supabase e a Publishable key.
6. No Supabase, abra SQL Editor, crie uma consulta e execute todo o conteúdo de `supabase/schema.sql`.
7. Em Authentication > Users, crie um usuário para entrar no sistema. (A tela de login ainda precisa ser implementada; para desenvolvimento, configure o acesso conforme evolução do projeto.)
8. Execute `npm run dev` e abra o endereço local mostrado pelo Vite.

## Atributos
Velocidade, finalização, passe, drible, defesa e controle (0 a 100).
Overall = média aritmética dos seis atributos, arredondada.

## Estado desta versão
É um MVP inicial: cadastro/listagem/exclusão de jogadores, criação de times, associação de jogadores aos times e ranking. Ainda faltam autenticação visual completa, edição de jogadores, exclusão de times e escalações táticas persistentes. A prévia tática/formação não está implementada nesta versão.

Não coloque `service_role` ou secret keys no frontend. Use somente a chave pública Publishable/anon.
