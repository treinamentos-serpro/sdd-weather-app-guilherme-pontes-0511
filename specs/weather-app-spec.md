# Weather App — Especificação de produto

## 1. Overview

### Objetivo

Permitir que uma pessoa encontre uma cidade ou, se preferir, use a localização
atual do navegador para consultar o clima atual e a previsão de cinco dias,
escolha a unidade de temperatura e use o produto em dispositivos móveis.

### Fonte e status

Esta especificação deriva de [discovery.md](./discovery.md), do pedido adicional
de consulta opcional pela localização atual e das convenções do projeto. Não
define arquitetura nem detalhes de implementação.

- **Confirmado:** capacidade solicitada explicitamente no briefing.
- **Derivado:** comportamento necessário para tornar uma capacidade utilizável
  ou atender às convenções do projeto, sem adicionar uma nova finalidade.
- **Proposto:** decisão de produto recomendada, ainda sujeita a confirmação.
- **Pendente:** detalhe não definido; deve ser resolvido nas Open Questions.

As capacidades principais estão definidas, mas os detalhes pendentes não devem
ser considerados aprovados nem resolvidos silenciosamente nas fases seguintes.

### Fluxo principal

1. O usuário informa o nome de uma cidade e seleciona um resultado, ou escolhe
   explicitamente usar a localização atual.
2. Se escolher a localização atual, o navegador solicita permissão e, se
   autorizada, fornece as coordenadas para a consulta.
3. O usuário visualiza o clima atual e a previsão de cinco dias da localização.
4. Alterna entre Celsius e Fahrenheit.
5. Pode repetir o fluxo para consultar outra localização.

## 2. Functional Requirements

### RF-01 — Buscar e selecionar cidades

**Status:** confirmado; seleção do resultado é derivada.

- Pesquisar somente cidades pelo nome; não oferecer buscas por estados, regiões
  ou países como resultados independentes.
- A busca deve ignorar diferenças entre letras maiúsculas/minúsculas e a
  ausência de acentos.
- Não é necessário oferecer correspondência parcial.
- Apresentar os resultados encontrados e permitir selecionar a cidade desejada.
- Identificar a localização selecionada na consulta meteorológica.
- Consultar e exibir uma única localização por vez; selecionar outra
  localização substitui a anterior.
- Não oferecer tratamento ou desambiguação especial para cidades homônimas.
- Não iniciar uma busca com entrada vazia ou composta apenas de espaços.

### RF-02 — Consultar o clima atual

**Status:** confirmado; identificação da cidade é derivada.

- Exibir as condições atuais da localização selecionada, seja uma cidade ou a
  localização atual obtida pelo navegador.
- Identificar a cidade ou localização à qual os dados pertencem.
- Quando disponíveis na fonte, exibir a temperatura atual, as temperaturas
  mínima e máxima, a chance de chuva, a sensação térmica e a umidade.
- Não apresentar dados de outra localização como se fossem da localização
  selecionada.
- A interface pode exibir o horário de referência/atualização dos dados, quando
  fornecido pela fonte.

### RF-03 — Consultar a previsão de cinco dias

**Status:** confirmado; identificação dos dias é derivada.

- Apresentar a previsão para os cinco dias seguintes ao dia atual, sem incluir
  o dia atual, conforme o fuso GMT-3.
- Identificar a data de cada dia e apresentar os dias em ordem cronológica.
- Para cada dia, exibir como obrigatórias as temperaturas máxima e mínima, a
  chance de chuva e a condição meteorológica.
- Não duplicar dias nem completar dados ausentes com valores inventados.

### RF-04 — Alternar Celsius e Fahrenheit

**Status:** confirmado; P-01 aprovada.

- Disponibilizar um controle para escolher Celsius ou Fahrenheit e indicar a
  seleção vigente.
- Usar Celsius como unidade inicial.
- Persistir a unidade escolhida no armazenamento do navegador e restaurá-la
  quando o usuário retornar à aplicação.
- Exibir a unidade junto a cada temperatura.
- Preservar o significado físico dos valores ao mudar a unidade.
- Arredondar temperaturas exibidas sem casas decimais ao inteiro mais próximo:
  uma fração decimal >= 0,5 arredonda para o inteiro seguinte; uma fração < 0,5,
  para o inteiro anterior.
- **P-01 aprovada:** aplicar a unidade selecionada a todas as temperaturas
  exibidas no clima atual e na previsão, inclusive após selecionar outra cidade.

### RF-05 — Comunicar estados da consulta

**Status:** derivado das convenções do projeto sobre loading, erro e vazio.

- Antes da primeira seleção, orientar o usuário a buscar uma cidade, sem exibir
  dados meteorológicos fictícios.
- Informar quando uma busca ou consulta meteorológica está em andamento.
- Diferenciar busca sem resultados de falha na consulta.
- Informar falhas de rede, indisponibilidade e dados insuficientes de forma
  compreensível, sem apresentá-las como sucesso.
- Após uma falha, realizar uma única nova tentativa. Se a tentativa também
  falhar, exibir uma mensagem de erro amigável.
- Ocultar os dados meteorológicos de consultas anteriores durante uma
  atualização ou nova consulta; se a operação falhar, mantê-los ocultos.
- Exibir os dados meteorológicos disponíveis mesmo quando a resposta estiver
  incompleta e indicar claramente quais informações estão indisponíveis.
- Permitir que o usuário faça uma nova busca ou consulta após uma falha.

### RF-06 — Consultar pela localização atual

**Status:** confirmado pelo pedido; estados de permissão e recuperação são
derivados.

- Oferecer um botão **Usar localização atual** como opção à busca por cidade.
- Somente após essa ação, solicitar a localização por meio da API de
  geolocalização do navegador e respeitar a permissão concedida ou negada pelo
  usuário.
- Com permissão concedida e coordenadas disponíveis, usar essas coordenadas
  para consultar o clima atual e a previsão de cinco dias previstos em RF-02 e
  RF-03. Exibir o nome da cidade ou região quando estiver disponível; caso
  contrário, identificar a origem como **Local atual**.
- Se a localização for indicada como aproximada, informar isso claramente ao
  usuário.
- Manter disponível a busca por cidade como alternativa; a localização atual
  não deve ser obtida automaticamente nem em segundo plano.
- Usar as coordenadas somente para atender à consulta iniciada pelo usuário e
  não persistí-las para histórico ou uso posterior.
- Se a API não estiver disponível, a permissão for negada ou não for possível
  obter coordenadas, informar a situação e permitir que o usuário busque uma
  cidade.

## 3. User Stories

| ID | História | Requisitos relacionados |
|---|---|---|
| US-01 | Como pessoa interessada no tempo de uma cidade, quero encontrá-la e selecioná-la para consultar a localização correta. | RF-01 |
| US-02 | Como pessoa planejando atividades, quero consultar o clima atual da cidade selecionada para conhecer suas condições presentes. | RF-02 |
| US-03 | Como pessoa planejando os próximos dias, quero consultar uma previsão de cinco dias para organizar minhas atividades. | RF-03 |
| US-04 | Como pessoa acostumada a uma unidade de temperatura, quero alternar entre Celsius e Fahrenheit para interpretar os valores com facilidade. | RF-04 |
| US-05 | Como pessoa consultando o clima, quero entender quando os dados estão carregando, ausentes ou indisponíveis para decidir como continuar. | RF-05 |
| US-06 | Como pessoa usando um dispositivo móvel, quero buscar uma cidade ou usar minha localização atual, consultar o clima e mudar a unidade sem dificuldades de leitura ou interação. | RF-01 a RF-06; RNF-01 e RNF-03 |
| US-07 | Como pessoa que prefere não digitar uma cidade, quero usar opcionalmente a localização atual do navegador para consultar o clima e a previsão de cinco dias do local onde estou. | RF-06 |

## 4. Acceptance Criteria

Os critérios devem ser verificáveis com cidades e dados meteorológicos
controlados. As referências a decisões pendentes não autorizam a adoção de uma
resposta implícita.

### US-01 — Busca e seleção

- **AC-01.1:** dada uma busca válida com resultados, quando a busca for
  acionada, então os resultados serão apresentados e poderão ser selecionados,
  sem diferenciar maiúsculas de minúsculas nem exigir acentos.
- **AC-01.2:** os resultados da busca incluirão cidades, não estados, regiões ou
  países como resultados independentes.
- **AC-01.3:** quando uma cidade for selecionada, então a consulta meteorológica
  corresponderá àquela localização, sua identificação ficará visível e ela
  substituirá qualquer localização consultada anteriormente.
- **AC-01.4:** dada uma entrada vazia ou apenas com espaços, então nenhuma busca
  será iniciada e a interface indicará que é necessário informar uma cidade.

### US-02 — Clima atual

- **AC-02.1:** dada uma cidade selecionada e a temperatura atual disponível,
  então ela será exibida com unidade e identificação da localização.
- **AC-02.2:** quando o usuário mudar da cidade A para a cidade B, então dados de
  A não serão apresentados como dados de B, mesmo que a resposta de A chegue
  depois da resposta de B.
- **AC-02.3:** quando disponíveis, as temperaturas mínima e máxima, chance de
  chuva, sensação térmica e umidade serão exibidas com seus significados e
  unidades, quando aplicável; informações indisponíveis serão indicadas como
  tal.

### US-03 — Previsão

- **AC-03.1:** dada uma resposta válida, então serão exibidos os cinco dias
  seguintes ao dia atual, sem incluir o dia atual, calculados no fuso GMT-3 e em
  ordem cronológica.
- **AC-03.2:** cada dia exibido deverá pertencer à cidade selecionada.
- **AC-03.3:** dada uma resposta com menos de cinco dias válidos, então a
  previsão disponível será exibida com indicação dos dias ou dados indisponíveis,
  sem duplicar dias ou fabricar valores.
- **AC-03.4:** para cada dia com dados disponíveis, serão exibidas as
  temperaturas máxima e mínima, a chance de chuva e a condição meteorológica;
  qualquer campo ausente será identificado como indisponível.

### US-04 — Unidade de temperatura

- **AC-04.1:** quando o usuário selecionar uma unidade, então o controle
  identificará essa unidade como ativa e as temperaturas afetadas exibirão o
  símbolo correspondente.
- **AC-04.2:** os valores deverão obedecer a `°F = (°C × 9/5) + 32` e à relação
  inversa. Nos casos de referência, `0 °C` corresponderá a `32 °F`, `100 °C` a
  `212 °F` e `-40 °C` a `-40 °F`.
- **AC-04.3 — P-01 aprovada:** ao alternar a unidade, todas as temperaturas
  visíveis do clima atual e da previsão mudarão para a mesma unidade.
- **AC-04.4 — P-01 aprovada:** ao selecionar outra localização, a unidade escolhida
  permanecerá aplicada enquanto a aplicação estiver aberta.
- **AC-04.5:** a unidade inicial será Celsius; após o usuário escolher outra
  unidade, essa escolha será persistida no armazenamento do navegador e
  restaurada quando a aplicação for reaberta.
- **AC-04.6:** temperaturas exibidas sem casas decimais serão arredondadas ao
  inteiro mais próximo: frações >= 0,5 resultarão no inteiro seguinte; frações
  < 0,5, no inteiro anterior.

### US-05 — Estados e recuperação

- **AC-05.1:** antes da primeira seleção, então a interface orientará a busca de
  uma cidade e não apresentará uma previsão fictícia.
- **AC-05.2:** enquanto houver uma operação em andamento, então seu estado de
  carregamento será perceptível ao usuário.
- **AC-05.3:** dada uma busca válida sem resultados, então a interface informará
  que nenhuma cidade foi encontrada e permitirá editar a busca.
- **AC-05.4:** dada uma falha de rede ou da fonte de dados, então a aplicação
  realizará uma única nova tentativa; se ela também falhar, exibirá uma mensagem
  de erro amigável e permitirá nova consulta.
- **AC-05.5:** dados campos meteorológicos ausentes ou inválidos, então eles não
  serão apresentados como zero, uma temperatura válida ou uma condição conhecida;
  a indisponibilidade será indicada.
- **AC-05.6:** em uma busca válida por cidade, o tempo de resposta será medido
  desde a ação de busca até o carregamento completo do clima atual e da previsão.
  Sob condições plenas de rede e dispositivo, o P95 (95º percentil) desses
  tempos deverá ser de até 30 segundos; se uma operação não for concluída nesse
  limite, a aplicação encerrará o carregamento e informará a falha.
- **AC-05.7:** durante uma atualização ou consulta de outra localização, os
  dados meteorológicos da consulta anterior não ficarão visíveis; se a operação
  falhar, continuarão ocultos e a interface comunicará a falha.
- **AC-05.8:** ao iniciar uma busca, se não houver dados meteorológicos válidos
  para a localização ou se a última atualização bem-sucedida tiver mais de
  30 minutos, a aplicação consultará novamente a fonte e não apresentará dados
  vencidos como atuais.

### US-06 — Uso móvel e acessível

- **AC-06.1:** na resolução de referência desktop de 1920x1080 e nos tamanhos
  de referência móvel (360 × 800 px, 390 × 844 px, 393 × 873 px, 412 × 915 px
  e 430 × 932 px), o usuário conseguirá buscar e selecionar uma cidade ou
  acionar o botão de localização atual, consultar o clima atual, ler os cinco
  dias e alternar a unidade.
- **AC-06.2:** em telas menores de desktop e em dispositivos móveis, o layout
  reorganizará as colunas em linhas adicionais quando necessário; informações e
  controles essenciais não ficarão distorcidos, cortados, sobrepostos ou
  dependentes de rolagem horizontal da página.
- **AC-06.3:** busca, seleção, botão de localização atual e alternância serão
  operáveis por toque e por teclado, com identificação acessível dos controles
  e foco visível.
- **AC-06.4:** loading, erro e vazio serão comunicados também de forma acessível,
  incluindo falhas de localização, sem depender apenas de cor ou de ícones.
- **AC-06.5:** usando um leitor de tela, o usuário conseguirá identificar os
  controles principais e receberá os estados relevantes, incluindo carregamento,
  erro, unidade selecionada e indicação de localização aproximada.
- **AC-06.6:** os fluxos principais funcionarão em navegadores baseados em
  Chromium, Firefox e Safari nos sistemas Windows, baseados em Linux e iOS,
  considerando os navegadores disponíveis para cada sistema.

### US-07 — Consulta pela localização atual

- **AC-07.1:** antes de o usuário acionar o botão **Usar localização atual**, a
  aplicação não solicitará acesso à localização nem iniciará sua obtenção.
- **AC-07.2:** quando o usuário acionar o botão, então a aplicação solicitará a
  localização pelo navegador; se a permissão for concedida e as coordenadas
  forem obtidas, o clima atual e a previsão de cinco dias corresponderão a essas
  coordenadas e a interface exibirá o nome da cidade ou região, se disponível,
  ou **Local atual** caso contrário.
- **AC-07.3:** enquanto a localização estiver sendo obtida ou consultada, a
  aplicação indicará o estado de carregamento.
- **AC-07.4:** se o navegador não oferecer a API, a permissão for negada ou não
  houver coordenadas disponíveis, então a aplicação informará que não foi
  possível consultar a localização e manterá disponível a busca por cidade.
- **AC-07.5:** se o usuário escolher uma cidade enquanto a consulta pela
  localização atual estiver em andamento, uma resposta atrasada dessa consulta
  não substituirá nem será apresentada como dados da cidade escolhida.
- **AC-07.6:** as coordenadas serão usadas somente para a consulta iniciada pelo
  usuário e não serão persistidas para histórico ou consultas futuras.
- **AC-07.7:** quando a localização fornecida for indicada como aproximada, a
  interface informará claramente que a localização é aproximada.

## 5. Non-Functional Requirements

| ID | Requisito | Status e verificação |
|---|---|---|
| RNF-01 | Responsividade: usar 1920x1080 como referência desktop e 360 × 800 px, 390 × 844 px, 393 × 873 px, 412 × 915 px e 430 × 932 px como tamanhos móveis de referência; reorganizar colunas em linhas adicionais em telas menores, sem distorcer ou ocultar informações. | Confirmado; verificar AC-06.1 e AC-06.2. |
| RNF-02 | Clareza: todas as temperaturas devem indicar sua unidade e cada visualização deve identificar a cidade consultada ou indicar **Local atual**. | Derivado; verificar AC-01.3, AC-02.1, AC-04.1 e AC-07.2. |
| RNF-03 | Acessibilidade: controles com identificação semântica, suporte a teclado, foco visível, comunicação acessível dos estados e compatibilidade com leitores de tela. | Confirmado pelo usuário e pelas convenções do projeto; verificar AC-06.3 a AC-06.5 e AC-07.4. |
| RNF-04 | Integridade: não misturar localizações, inventar dados ausentes ou alterar o significado das temperaturas na mudança de unidade. | Derivado; verificar AC-02.2, AC-03.2 a AC-03.4, AC-04.2 e AC-05.5. |
| RNF-05 | Resiliência: falhas, dados parciais e ausência de resultados ou localização devem ser explícitos e não impedir uma nova consulta. | Derivado; verificar AC-03.3, AC-05.3 a AC-05.5, AC-05.7 e AC-07.4. Dados meteorológicos anteriores não ficam visíveis durante atualizações nem após falhas. |
| RNF-06 | Desempenho: o fluxo de busca por cidade e consulta meteorológica deve carregar completamente em até 30 segundos, com timeout de 30 segundos; medir desde a ação de busca até a exibição completa do clima atual e da previsão, sob condições plenas de rede e dispositivo, usando P95 (95º percentil) como estatística de aceite. | Limite, timeout, intervalo, condições de medição e estatística de aceite definidos; verificar AC-05.6. |
| RNF-07 | Atualidade e disponibilidade: os dados meteorológicos devem ter idade máxima de 30 minutos; em uma nova busca, atualizar dados cuja última atualização bem-sucedida tenha mais de 30 minutos. A disponibilidade mínima deve ser de 99% ao mês, incluindo a fonte meteorológica externa. | Idade máxima e atualização sob demanda definidas; acompanhar separadamente a disponibilidade da fonte para avaliar se é necessário trocar o fornecedor. |
| RNF-08 | Idioma e compatibilidade: a interface deve ser apresentada somente em pt-BR e suportar navegadores baseados em Chromium, Firefox e Safari em sistemas Windows, baseados em Linux e iOS. | Confirmado; verificar AC-06.6. |
| RNF-09 | Privacidade da localização: solicitar acesso somente após ação explícita do usuário e não persistir coordenadas para histórico ou uso posterior. | Derivado do caráter opcional da funcionalidade; verificar AC-07.1 e AC-07.6. |

## 6. Edge Cases

| Caso | Comportamento esperado | Referência |
|---|---|---|
| Busca vazia ou apenas com espaços. | Não buscar e orientar o preenchimento. | RF-01; AC-01.4 |
| Busca válida sem correspondências. | Informar ausência de resultados e permitir outra busca. | RF-05; AC-05.3 |
| Cidades homônimas. | Não há desambiguação ou tratamento especial; a busca pode não permitir identificar qual cidade de mesmo nome foi selecionada. | RF-01; R-01 |
| Busca com variação de maiúsculas/minúsculas ou sem acentos. | Tratar como correspondente ao mesmo nome de cidade. | RF-01; AC-01.1 |
| Busca por estado, região ou país, em vez de uma cidade. | Não retornar esses termos como resultados independentes de cidade. | RF-01; AC-01.2 |
| Troca rápida de cidade com respostas fora de ordem. | Não exibir dados de uma consulta anterior como se fossem da seleção vigente. | RF-02; AC-02.2 |
| Falha de rede, ausência de conexão ou indisponibilidade da fonte. | Realizar uma única nova tentativa; se falhar novamente, mostrar erro amigável e permitir nova consulta. | RF-05; AC-05.4 |
| Operação sem resposta. | Encerrar o carregamento com erro ao atingir o timeout de 30 segundos. | AC-05.6 |
| Dados meteorológicos sem atualização há mais de 30 minutos. | Na próxima busca, consultar a fonte novamente e não apresentar dados vencidos como atuais. | RNF-07; AC-05.8 |
| Campo ausente, resposta inválida ou condição meteorológica desconhecida. | Não inventar valores; mostrar os dados válidos e indicar os campos indisponíveis. | RF-05; AC-02.3, AC-03.4 e AC-05.5 |
| Previsão com menos de cinco dias válidos. | Mostrar os dias disponíveis e indicar os dias indisponíveis, sem duplicar ou inventar dados. | AC-03.3 |
| Apenas clima atual ou apenas previsão disponível. | Mostrar a parte disponível e indicar qual consulta está indisponível. | RF-05 |
| Temperaturas negativas e alternância repetida de unidade. | Preservar equivalência física e unidade explícita, sem acumular erro de conversão. | RF-04; AC-04.2 |
| Mudança de dia ou consulta de cidade em outro fuso. | Calcular os cinco dias seguintes no fuso GMT-3. | RF-03; AC-03.1 |
| Dados anteriores durante uma atualização ou após falha. | Ocultar os dados meteorológicos anteriores durante a atualização e mantê-los ocultos após uma falha, comunicando o erro. | RF-05; AC-05.7 |
| Tela menor que 1920x1080 ou mudança de orientação. | Reorganizar colunas em linhas adicionais e preservar leitura e interação nos tamanhos móveis de referência e em telas menores. | RNF-01; AC-06.1 e AC-06.2 |
| Navegador sem suporte à API de geolocalização ou permissão negada. | Informar que a localização não está disponível e manter a busca por cidade. | RF-06; AC-07.4 |
| Localização desativada, indisponível ou sem resposta. | Encerrar o carregamento com uma mensagem e manter a busca por cidade. | RF-06; AC-07.3 e AC-07.4 |
| Usuário escolhe uma cidade durante a consulta da localização atual. | A resposta atrasada da localização não substitui a cidade escolhida. | RF-06; AC-07.5 |
| Coordenadas imprecisas ou sem localidade identificável. | Indicar quando a localização for aproximada; mostrar cidade/região se disponível ou **Local atual** caso contrário. | RF-06; AC-07.2 e AC-07.7 |

## 7. Assumptions

- **AS-01 — Origem:** a discovery e as respostas do usuário às perguntas da
  especificação são fontes de requisitos; somente os detalhes listados em Open
  Questions permanecem sem decisão.
- **AS-02 — Dados:** consultas meteorológicas dependem de uma fonte externa.
  As convenções do projeto indicam Open-Meteo, mas sua cobertura e disponibilidade
  não substituem a definição dos requisitos de produto.
- **AS-03 — Qualidade:** tratamento de loading, erro e vazio, suporte a teclado
  e compatibilidade com leitores de tela são requisitos do projeto.
- **AS-04 — Dados meteorológicos:** os campos obrigatórios e opcionais estão
  definidos em RF-02 e RF-03; a fonte pode não fornecer todos os dados e, nesse
  caso, a indisponibilidade deve ser indicada.
- **AS-05 — Escopo:** recursos não solicitados não integram esta entrega sem
  uma decisão explícita de ampliação de escopo.
- **AS-06 — Unidade:** P-01 foi aprovada; os detalhes de aplicação da unidade e
  de arredondamento estão definidos em RF-04.
- **AS-07 — Localização:** a API de geolocalização do navegador fornece as
  coordenadas; a fonte meteorológica usa essas coordenadas para consultar o
  clima. O navegador controla a solicitação de permissão; nome da localidade e
  indicação de precisão só são exibidos quando disponíveis.

## 8. Risks

| ID | Risco | Impacto | Mitigação | Referência |
|---|---|---|---|---|
| R-01 | Seleção incorreta entre cidades homônimas, sem desambiguação prevista. | Consulta de dados de outra localização. | Limitação aceita no escopo atual; não há identificação especial de cidades homônimas. | RF-01 |
| R-02 | Fonte externa lenta, indisponível ou sujeita a limites. | Consultas sem resposta ou dados desatualizados. | Validar limitações da fonte, definir timeout e comunicar erros; ocultar dados anteriores durante atualizações ou falhas; acompanhar a disponibilidade total e a da fonte separadamente para avaliar a necessidade de troca do fornecedor. | RF-05; RNF-06 e RNF-07 |
| R-03 | Interpretação divergente de “cinco dias”. | Intervalo de previsão diferente do esperado. | Definir e testar os cinco dias seguintes no fuso GMT-3. | RF-03; AC-03.1 |
| R-04 | Unidade aplicada parcialmente ou conversão incorreta. | Interpretação errada das temperaturas. | Exibir unidade, verificar conversões de referência, aplicação uniforme e persistência da preferência. | RF-04; AC-04.2 a AC-04.6 |
| R-05 | Layout inadequado em telas pequenas ou controles inacessíveis a leitores de tela. | Fluxos principais impossíveis para parte dos usuários. | Reorganizar colunas em telas menores e validar responsividade, navegadores, sistemas operacionais, teclado e leitor de tela. | RNF-01, RNF-03 e RNF-08; AC-06.1 a AC-06.6 |
| R-06 | Fonte não fornecer algum campo meteorológico esperado. | Dados atuais ou previsão parcialmente indisponíveis. | Mostrar os campos disponíveis e indicar os indisponíveis, sem inventar valores. | RF-02, RF-03 e RF-05 |
| R-07 | Respostas antigas sobrescreverem a consulta mais recente. | Dados incompatíveis com a cidade ou localização atual selecionada. | Exigir consistência da seleção mesmo com respostas fora de ordem. | AC-02.2 e AC-07.5 |
| R-08 | Pendências serem tratadas como decisões aprovadas. | Retrabalho ou critérios de aceite divergentes. | Registrar respostas e atualizar a especificação antes de implementar os detalhes afetados. | Open Questions |
| R-09 | A localização ser negada ou indisponível em alguns navegadores ou dispositivos. | O usuário não consegue consultar pelo local atual. | Manter a busca por cidade e informar como prosseguir. | RF-06; AC-07.4 |
| R-10 | Coordenadas imprecisas ou expostas além da consulta solicitada. | Previsão associada ao local errado ou preocupação com privacidade. | Usar localização somente após ação explícita, não persistir coordenadas e indicar quando a localização for aproximada. | RF-06; RNF-09; AC-07.7 |

## 9. Out of Scope

Não fazem parte do escopo solicitado:

- Cadastro, autenticação e perfis de usuário.
- Solicitação automática ou contínua de localização, inclusive em segundo plano,
  sem ação explícita do usuário.
- Favoritos, histórico de cidades e comparação simultânea de múltiplas cidades.
- Previsão por hora, previsão além de cinco dias e histórico meteorológico.
- Alertas, notificações e recomendações personalizadas.
- Mapas, radar e funcionalidades meteorológicas especializadas.
- Aplicativos nativos e operação offline garantida.

Esses itens poderão ser reconsiderados mediante decisão explícita. As decisões
pendentes listadas em Open Questions não são exclusões definitivas do produto.

## 10. Open Questions

Nenhuma questão em aberto no momento.