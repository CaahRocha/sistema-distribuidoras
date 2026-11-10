# Contexto da Desenvolvedora - Carolina

## Sobre a Desenvolvedora
- **Nome:** Carolina
- **Profissão:** Analista de T.I no Banco Original
- **Sistema:** Windows 11
- **Experiência:** 
  - 1 ano com Cypress e JavaScript
  - Primeiro sistema completo: Mercadinho Dois Irmãos (Node.js + React)
  - Aprendendo desenvolvimento para adquirir mais conhecimento
- **Observação:** Tem TDAH - prefere perguntar tudo para ter certeza, mesmo que já saiba. Manter explicações claras e diretas.

## Ambiente de Desenvolvimento
- **IDE:** Kiro (VS Code com IA)
- **Node.js:** v22.14.0
- **Navegador preferido:** Chrome ou Edge (evitar Opera)
- **Shell:** PowerShell

## Stack Preferida
- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **Banco de dados:** SQLite (better-sqlite3) - local, sem necessidade de servidor
- **Estilo:** CSS puro (sem frameworks como Tailwind)
- **Autenticação:** JWT

## Estrutura de Projeto Padrão
```
projeto/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── database/
│   ├── database/
│   │   └── .gitkeep
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   ├── dist/ (build)
│   └── package.json
├── INICIAR.bat (script para iniciar o sistema)
├── ATUALIZAR.bat (script para atualizar)
└── README.md
```

## Configurações Importantes
- **Servidor escuta em:** `0.0.0.0` (para acesso na rede local)
- **Porta padrão:** 3001
- **Frontend buildado** servido pelo backend (pasta dist)

## Preferências de Código
- Comentários em português
- Mensagens de erro/sucesso em português
- Nomes de variáveis em inglês (padrão)
- Sempre fazer build do frontend antes de commit
- Usar .gitignore para node_modules e arquivos .db

## Scripts Úteis (INICIAR.bat)
```batch
@echo off
cd backend
npm start
```

## Projeto Anterior (Referência)
- **Mercadinho Dois Irmãos:** Sistema PDV completo
- **GitHub:** https://github.com/CaahRocha/mercadinho-dois-irmaos
- Funcionalidades: vendas, produtos, clientes fiado, caixa, relatórios

## Observações
- Projetos são para aprendizado e uso real em pequenos negócios
- Priorizar simplicidade e funcionalidade
- Sistema precisa funcionar offline (banco local)
- Acesso via rede local entre PCs
- Pode perguntar qualquer coisa, mesmo que pareça básico!
