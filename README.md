# Sistema Distribuidoras

Sistema de gestão para distribuidoras de bebidas, tabacos e artigos de fumo.

## 🚀 Como instalar

1. Clone ou baixe o projeto
2. Execute o `ATUALIZAR.bat` para instalar as dependências e fazer o build do frontend
3. Execute o `INICIAR.bat` para iniciar o servidor
4. Acesse no navegador: **http://localhost:3001**

## 🔐 Acesso padrão

| Usuário | E-mail | Senha |
|---|---|---|
| Administrador | admin@distribuidora.com | admin123 |

> ⚠️ Troque a senha do admin após o primeiro acesso!

## 📦 Módulos

- **Dashboard** — Resumo geral: vendas do dia, caixa, alertas
- **Pedidos** — Criar e fechar pedidos, com baixa automática de estoque
- **Clientes** — Cadastro de clientes com controle de fiado
- **Produtos** — Cadastro de produtos com categorias *(admin)*
- **Estoque** — Controle de entradas e movimentações *(admin)*
- **Financeiro** — Fiado e caixa do dia
- **Relatórios** — Vendas, top produtos, estoque, fiado *(admin)*
- **Usuários** — Gerenciar usuários do sistema *(admin)*

## 👥 Perfis

- **Admin** — Acesso total ao sistema
- **Caixa** — Pedidos, clientes, financeiro (fiado)

## ⚙️ Tecnologias

- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Frontend:** React + Vite + CSS puro
- **Autenticação:** JWT

## 🌐 Acesso na rede local

O sistema escuta em `0.0.0.0:3001`, então outros computadores na mesma rede podem acessar pelo IP da máquina onde o servidor está rodando.

Exemplo: `http://192.168.1.100:3001`
