# ÁGUIA COMMAND — Inteligência de Carteira & Contemplações

## Objetivo
Sistema interno para acompanhamento da carteira de consórcio de Cleber/Erika, com visão executiva, controle financeiro, sorteios, radar de proximidade, contemplações confirmadas, importação de planilhas, multiusuário e auditoria.

## Regras de negócio
- Radar é apenas proximidade numérica para conferência. Não é previsão nem confirmação de contemplação.
- Classificação: MATCH_EXATO = 0; CRITICO <=20; ALTO 21–50; RADAR 51–100; MONITORAMENTO >100.
- Cotas inadimplentes preservam a distância no histórico, mas não entram no radar elegível.
- Contemplação só pode ser marcada como CONFIRMADA por ação explícita de usuário autorizado.
- Clientes/cotas são arquivados em vez de excluídos sempre que possível.

## Perfis
- OWNER: controle total, inclusive outros proprietários.
- ADMINISTRATIVO: operação diária, clientes, cotas, financeiro, sorteios e importações.
- GESTOR: leitura global.
- CONSULTOR: apenas a própria carteira via RLS.
- AUDITOR: leitura global e auditoria.

A organização nunca pode ficar sem pelo menos um OWNER ativo.

## Busca universal
Campo único: `Pesquisar cliente, CPF, grupo ou cota…`.
- Texto: nome fuzzy, sem acento/case.
- 11 dígitos: CPF normalizado/exato.
- Número curto: grupo e cota.
- Valor da carta é filtro separado por faixa.
- Debounce de ~300 ms e até 20 resultados.

## Backend
Supabase/PostgreSQL com tabelas prefixadas `aguia_`, RLS, trilha de auditoria e bucket privado `aguia-drawings`.

Principais entidades: organizations, members, invites, clients, client_quotas, payment_history, drawings, drawing_numbers, matches, contemplations, imports e audit_logs.

## Dados iniciais
A carga inicial foi derivada da planilha operacional fornecida, com 35 cotas ativas, R$ 3.908.531,11 em crédito ativo e 5 cotas inadimplentes. O resultado de agosto/2026 (19/08/2026, extração 6093-3) foi registrado e cruzado com as categorias 1000, 2000, 3333, 5000 e 9999.

## Segurança
- Nunca usar service-role no navegador.
- Chave pública/publishable do Supabase pode existir no frontend; acesso aos dados depende de Auth + RLS.
- Cada pessoa deve usar e-mail e senha próprios.
- Ações relevantes ficam em `aguia_audit_logs`.
- Imagens de sorteio ficam em bucket privado.

## Fluxo mensal
1. ADMIN/OWNER abre Sorteios.
2. Faz upload da imagem.
3. Confere competência, data, extração e 25 números.
4. Confirma o resultado.
5. O banco recalcula o radar.
6. O time analisa elegíveis/bloqueados.
7. Contemplação é confirmada separadamente após evidência oficial.

## Próxima fase
Conectar extração por visão/IA à tela de sorteio, mantendo obrigatoriamente a conferência humana antes da gravação. Também é recomendada a migração deste branch de preview para um repositório privado dedicado `aguia-command` após aprovação visual/funcional.
