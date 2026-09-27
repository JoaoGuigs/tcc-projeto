# Organização das telas do Figma

Inspeção em 27/09/2026. Arquivo: https://www.figma.com/design/QVujpFRrxKQrwrwak39U6U

## Situação

O MCP autenticou e permitiu leitura, mas atingiu o limite do plano Starter antes de qualquer alteração. Nenhuma tela foi movida ou modificada. Página de destino proposta: **Sistema atual — telas do código**.

O arquivo contém `Page 1` (`0:1`), com várias gerações de telas, e `Home — Reformulação` (`5:2`). As correspondências abaixo são referências de fluxo; não significam igualdade visual ou funcional com a implementação.

## Mapeamento para retomar

| Código / rota | Referência encontrada | Node ID | Observação |
| --- | --- | --- | --- |
| HomePage /home | Home / Desktop 1920, na página Home — Reformulação | 5:3 | Cabeçalho, atendimento em destaque, métricas e agenda correspondem à estrutura do código; há diferenças de detalhe. |
| AgendarConsultaPage /agendar | R2 Agenda dia | 24:2 | Referência para visualização diária. |
| AgendarConsultaPage /agendar | R3 Agenda semanal | 26:2 | Referência para visualização semanal. |
| AgendarConsultaPage /agendar | R2 Agenda mês | 24:1227 | Referência para visualização mensal. |
| PacientesPage /pacientes | R3 Pacientes | 26:194 | Mesma função, mas tabela e ações diferem. |
| NewPatientModal | R5 Modal Novo paciente | 38:2 | Campos nome, celular, profissão, convênio, carteirinha e descrição do problema. |
| RegistrarAtendimentoPage /atendimentos/novo | R2 Evolução clínica | 24:851 | Referência de registro; contém campos adicionais à implementação. |
| WhatsAppPage /whatsapp | R2 WhatsApp | 24:1434 | Referência de conversas e contexto do cuidado. |
| LoginPage /login e / | R2 Login; Login original | 24:715; 15:67 | Comparar antes de escolher: o código usa “Mais tempo para cuidar de cada paciente” e “Bem-vinda de volta”. |
| CadastroUsuarioPage /cadastro | R2 Cadastro profissional | 24:234 | Mesma finalidade; confirmar diferença de formulário. |
| PacienteCadastroPage /pacientes/novo | R2 Novo paciente | 24:152 | Rota existe além do modal; design tem etapas e campos distintos. |
| ConfiguracoesPage /configuracoes | R2 Configurações | 24:534 | Conteúdo detalhado ainda precisa ser conferido. |
| ConveniosPage /convenios | R2 Convênios | 24:756 | Conteúdo detalhado ainda precisa ser conferido. |
| RelatorioPacientePage /relatorios | R2 Relatórios | 24:1109 | Código é relatório por paciente; frame é visão geral da clínica. Não marcar como reprodução da tela implementada. |
| FinanceiroPage /financeiro | R2 Financeiro | 24:1559 | Código é apenas “Em breve”; frame completo é proposta futura. |
| Perfil dentro de PacientesPage | R2 Perfil paciente | 24:418 | Código abre modal de 520px, não página inteira. Manter como proposta, salvo correspondência mais próxima encontrada. |

Outros nós: biblioteca organizada por fluxo `30:2`; dashboard R4 `35:2`; componente de menu R4 `35:150`; mobile R2 `25:2`; estados do sistema `24:637`.

## Próxima ação autorizada

Concluir a comparação dos candidatos, criar a página de destino e mover os quadros correspondentes, preservando seus conteúdos e dimensões. Agrupar por fluxo e nomear com as rotas. Manter variantes antigas e propostas no local original; distinguir referências de funcionalidades ainda não implementadas. Verificar pais, quantidade e dimensões após a movimentação.
