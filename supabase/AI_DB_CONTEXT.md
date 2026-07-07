# AI DB Context — Central Lucenera

Este sistema é o Hub de acesso do ecossistema Lucenera e usa o Supabase compartilhado como fonte de verdade.

## SPEC-006 — permissões granulares

A Central consome as tabelas e RPCs da migration central `20260708_029_spec006_permissoes_granulares_hub`:

- `systems.slug` e `systems.visivel_no_hub`;
- `modulos`, `modulo_acoes`;
- `papeis`, `papel_permissoes`;
- `usuario_papeis`, `usuario_permissao_excecoes`;
- `auditoria_permissoes`;
- RPCs `hub_pode_executar` e `hub_sistemas_permitidos`.

Estado remoto em 2026-07-07: objetos confirmados no Supabase compartilhado e refletidos no snapshot central `supabase/db/current/`.

O dashboard deve preferir `hub_sistemas_permitidos(p_usuario_id)` para listar cards permitidos. `user_system_access` permanece apenas como fallback de transição.

## SPEC-007 — SSO entre sistemas

A Central abre sistemas por `redirectWithCode()` em `src/lib/cross-system-auth.ts`, chamando a Edge Function `generate-cross-system-code`.

Estado remoto em 2026-07-07: `generate-cross-system-code` e `exchange-cross-system-code` estão publicadas como `ACTIVE`; falta homologação com usuário real.

Não passar `access_token` nem `refresh_token` em URL. O único parâmetro em URL deve ser `sso_code`, consumido pelo sistema de destino via `exchange-cross-system-code`.

## Cuidados

- Não voltar o dashboard para leitura exclusiva de `user_system_access`.
- Não hardcodar regra nova de permissão se ela deve nascer em `papeis`/`papel_permissoes`.
- Atualizar este contexto se novas tabelas/ações do Hub forem adicionadas à matriz.
