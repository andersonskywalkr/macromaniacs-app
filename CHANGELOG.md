# Changelog

Todas as mudanças relevantes do app MacroManiacs. O formato segue o
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.1.0] - 2026-11-21

Primeira versão entregue.

### Adicionado
- Cadastro e login, com aceite dos termos de uso, da política de privacidade e do termo de consentimento (LGPD, versão 2026-11-14) e link para o documento no Cadastro e no Perfil.
- Onboarding (sexo feminino ou masculino, idade, altura, peso, objetivo e nível de atividade) e Editar perfil, com cálculo de metas feito pelo backend.
- Início com anel de calorias, macros, sequência de dias e pontos.
- Busca de alimentos com sugestões enquanto digita, histórico de buscas, ordenação por relevância no app (nome, fonte e código de barras), cadastro manual de alimento e tratamento de indisponibilidade das fontes externas.
- Refeições com vários alimentos e tipo de refeição, revisão, edição e exclusão, e fila offline para enviar quando a conexão voltar.
- Progresso diário e histórico de desempenho (meta batida).
- Missões, conquistas, pontos e loja de recompensas.
- Grupos com convite por código, chat, ranking e perfil do grupo.
- Avatar personalizável (estilo Avataaars, gerado no aparelho, sem rede), salvo só no aparelho.
- Tema claro e escuro, com barras de status e de navegação seguindo o tema do app.
- Modo mock (funciona sem internet, para apresentação) e modo API real, escolhidos por variáveis `EXPO_PUBLIC_*`.
- Builds Android (APK) `preview-mock` e `preview-real` no EAS.

### Limitações conhecidas
- Login com Google e sino de notificações ainda não funcionam.
- Fotos de refeição e leitura de código de barras pela câmera não existem nesta versão.
- O avatar não sincroniza entre aparelhos nem aparece para os outros membros.
- A relevância da busca só reordena os itens já carregados; a ordenação na consulta depende do backend.
