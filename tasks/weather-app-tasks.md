# Weather App — Backlog de Tarefas

Backlog derivado da [especificação](../specs/weather-app-spec.md) e do
[plano técnico](../plans/weather-app-plan.md). Os critérios de aceite citam RF,
RNF e AC para manter a rastreabilidade.

## Convenções

- **Tipo:** `Data`, `UI`, `Test` ou `Infra`.
- **Prioridade:** `P0` desbloqueia a primeira fatia funcional; `P1` completa
  requisitos de produto e hardening antes do ship; `P2` é acompanhamento
  operacional contínuo, não uma funcionalidade dispensável.
- **Tamanho:** `P` (um arquivo ou função isolada), `M` (integração pequena,
  normalmente até dois arquivos), `G` (grande demais para este backlog).
- As dependências listadas são pré-requisitos reais; `—` significa que a tarefa
  não depende de outra tarefa deste backlog. A ordem por entrega continua sendo
  a sequência recomendada.
- Após a decomposição, nenhuma tarefa ficou tamanho `G`; nenhuma mistura código
  de produto com seus testes dedicados.

## Entrega 1 — Tipos e funções puras

### T-01 — Definir os tipos compartilhados do domínio

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Criar os contratos TypeScript para resultados de cidade,
localização e dados meteorológicos normalizados.  
**Critérios de aceite (RF-02, RF-03, RF-04, RF-06; RNF-04, RNF-09):**

- Exportar `TemperatureUnit`, `LocationSource`, `City`, `Coordinates`,
  `WeatherLocation`, `WeatherCondition`, `CurrentWeather`, `ForecastDay` e
  `WeatherSnapshot`.
- Temperaturas do domínio são sempre Celsius; os campos que a API pode omitir
  são opcionais, não preenchidos com zero.
- `WeatherSnapshot` separa `current`, `nextFiveDays`, `expectedDates` e
  `fetchedAt`; `expectedDates` representa as cinco datas esperadas.
- `Coordinates` é um tipo transitório de entrada do serviço, não um campo de
  `WeatherLocation` ou `WeatherSnapshot`; não há tipos para persistir coordenadas.
- Não usar `any` nem incluir lógica de execução no arquivo.

**Dependências:** —  
**Arquivos prováveis:** `src/types/weather.ts`

### T-02 — Normalizar consultas de cidade

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar uma função pura para normalizar a entrada da busca.  
**Critérios de aceite (RF-01; AC-01.1, AC-01.4):**

- Remover espaços externos, diferenças de caixa e diacríticos com normalização
  Unicode.
- Retornar string vazia para entrada vazia ou composta somente por espaços.
- Não alterar o texto original que será exibido na interface.

**Dependências:** —  
**Arquivos prováveis:** `src/lib/normalizeCityQuery.ts`

### T-03 — Implementar conversão e arredondamento de temperatura

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Criar funções puras que convertam valores-base em Celsius para
Celsius ou Fahrenheit e arredondem a apresentação.  
**Critérios de aceite (RF-04; AC-04.2, AC-04.6):**

- Implementar `°F = (°C × 9/5) + 32` sem alterar o valor-base em Celsius.
- Arredondar para inteiro conforme RF-04, sem acumular conversões sucessivas.
- `0 °C`, `100 °C` e `-40 °C` resultam, respectivamente, em `32 °F`, `212 °F`
  e `-40 °F`.

**Dependências:** T-01  
**Arquivos prováveis:** `src/lib/temperature.ts`

### T-04 — Calcular as datas da previsão em GMT-3

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar funções puras para determinar o dia de referência e
as cinco datas seguintes no fuso previsto pela especificação.  
**Critérios de aceite (RF-03; AC-03.1, AC-03.3):**

- Usar a referência GMT-3 (`America/Sao_Paulo`), sem depender do fuso local do
  navegador ou da cidade consultada.
- Retornar exatamente cinco datas únicas, cronológicas e posteriores ao dia
  atual nesse fuso.
- Tratar datas ISO como datas de calendário para não deslocá-las por conversão
  acidental de fuso.

**Dependências:** —  
**Arquivos prováveis:** `src/lib/date.ts`

### T-05 — Mapear códigos meteorológicos WMO

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Traduzir códigos WMO usados pelo Open-Meteo em condições
meteorológicas em pt-BR.  
**Critérios de aceite (RF-02, RF-03; AC-02.3, AC-03.4, AC-05.5):**

- Mapear os códigos WMO suportados para descrições em pt-BR.
- Retornar condição indisponível para código ausente ou não mapeado.
- Não inventar descrição para um código desconhecido.

**Dependências:** T-01  
**Arquivos prováveis:** `src/lib/weatherCode.ts`

## Entrega 2 — Integração com dados e localização

### T-06 — Implementar busca de cidades Open-Meteo

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Adicionar a chamada de geocodificação e normalizar resultados para
o modelo `City`.  
**Critérios de aceite (RF-01; AC-01.1 a AC-01.4):**

- Consultar `https://geocoding-api.open-meteo.com/v1/search` com
  `URLSearchParams`, `count=10`, `language=pt` e `format=json`.
- Não fazer requisição para consulta vazia; enviar a consulta normalizada por
  T-02.
- Aceitar resultados de localidades povoadas (`feature_code` da família `PPL`)
  e não apresentar países/regiões/divisões administrativas como cidades.
- Mapear identificador, nome, coordenadas e metadados opcionais para `City`;
  resultados válidos podem ser selecionados e cidades homônimas não recebem
  tratamento especial.
- Distinguir lista vazia de falha HTTP, de rede ou de payload inválido.

**Dependências:** T-01, T-02  
**Arquivos prováveis:** `src/services/openMeteoService.ts`

### T-07 — Implementar consulta e normalização da previsão

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Consultar clima atual e previsão em uma chamada e converter a
resposta para `WeatherSnapshot`.  
**Critérios de aceite (RF-02, RF-03; AC-02.1 a AC-02.3, AC-03.1 a AC-03.4):**

- Solicitar os campos atuais, horários de probabilidade de precipitação e campos
  diários definidos no plano, com `temperature_unit=celsius`,
  `forecast_days=6` e `timezone=America/Sao_Paulo`.
- Usar os dados diários de hoje para mínima/máxima do cartão atual e o valor
  horário correspondente ao horário atual para probabilidade de chuva atual.
- Produzir no máximo cinco dias posteriores a hoje, sem duplicatas e em ordem;
  manter os campos ausentes como indisponíveis.
- Ignorar números não finitos, percentuais fora de 0–100 e datas inválidas;
  respostas parciais continuam representáveis pelo modelo.
- Validar status HTTP e formato da resposta; expor falha tipada ao chamador.

**Dependências:** T-01, T-04, T-05, T-06  
**Arquivos prováveis:** `src/services/openMeteoService.ts`

### T-08 — Encapsular a API de geolocalização do navegador

**Tipo:** Data · **Prioridade:** P1 · **Tamanho:** P  
**Descrição:** Criar um serviço pequeno que converta a API do navegador em uma
resposta tipada e erros compreensíveis pela aplicação.  
**Critérios de aceite (RF-06; AC-07.1, AC-07.4, AC-07.6, AC-07.7; RNF-09):**

- Chamar `navigator.geolocation` somente quando explicitamente invocado pelo
  hook; nunca iniciar obtenção automática.
- Retornar coordenadas e a precisão reportada pelo navegador, sem persistir ou
  registrar coordenadas.
- Distinguir API ausente, permissão negada, indisponibilidade e timeout.
- Encerrar a solicitação em até 30 segundos.

**Dependências:** T-01  
**Arquivos prováveis:** `src/services/geolocationService.ts`

## Entrega 3 — Orquestração de estado

### T-09 — Orquestrar busca e consulta por cidade

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Criar o hook da busca por cidade, seleção de resultado e
carregamento meteorológico, com estados e cancelamento seguros.  
**Critérios de aceite (RF-01, RF-02, RF-05; AC-01.3, AC-02.2, AC-05.2,
AC-05.4, AC-05.7, AC-05.8; RNF-06):**

- Expor estados discriminados de busca, resultados, carregamento, dados prontos,
  vazio e erro.
- Ao iniciar uma consulta, ocultar dados meteorológicos anteriores; mantê-los
  ocultos se a consulta falhar.
- Fazer uma única nova tentativa para uma etapa remota que falhar, sem repetir
  entrada inválida, resultado vazio ou operação cancelada.
- Aplicar um limite total de 30 segundos iniciado na busca válida; se expirar,
  cancelar a chamada ativa e publicar erro.
- Invalidar operações anteriores por identificador e/ou `AbortController`;
  resposta atrasada de uma cidade anterior nunca atualiza o estado vigente.
- Não manter cache de clima: cada nova seleção busca dados atuais; alternar
  unidade não aciona o serviço.

**Dependências:** T-06, T-07  
**Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-10 — Orquestrar consulta por localização atual

**Tipo:** Data · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Adicionar ao hook o fluxo que obtém localização somente por ação
explícita e busca o clima por coordenadas.  
**Critérios de aceite (RF-06; AC-07.1 a AC-07.7; RNF-09):**

- Iniciar loading ao solicitar localização e chamar o serviço T-08 somente após
  ação do usuário.
- Consultar o forecast com as coordenadas recebidas; exibir nome disponível ou
  `Local atual` e indicar localização aproximada quando informada pelo navegador.
- Não colocar coordenadas em estado persistido, `localStorage` ou logs; descartá-
  las depois da operação.
- Se a pessoa selecionar uma cidade durante a geolocalização, ignorar a resposta
  atrasada da localização.
- Em qualquer falha de localização, expor erro acessível e manter a busca por
  cidade disponível.

**Dependências:** T-08, T-09  
**Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-11 — Gerenciar a unidade de temperatura persistida

**Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Criar hook para carregar, atualizar e persistir a preferência
Celsius/Fahrenheit.  
**Critérios de aceite (RF-04; AC-04.1 a AC-04.6):**

- Iniciar em Celsius; aceitar somente `C` ou `F` da chave
  `weather-app:temperature-unit` no `localStorage`.
- Atualizar a preferência em memória e persistir mudanças; a unidade permanece
  após trocar cidade e ao reabrir a aplicação.
- Se armazenamento estiver indisponível, manter a unidade na sessão e expor
  estado para informar que não foi possível persistir.

**Dependências:** T-01, T-03  
**Arquivos prováveis:** `src/hooks/useTemperatureUnit.ts`

## Entrega 4 — Componentes de interface

### T-12 — Criar formulário acessível de busca

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar o campo e a ação de busca por cidade.  
**Critérios de aceite (RF-01, RF-05; AC-01.4, AC-05.2, AC-06.3):**

- Campo e botão têm nomes acessíveis e operam por toque e teclado.
- Entrada vazia ou só com espaços não chama o hook e comunica a necessidade de
  informar uma cidade.
- O formulário aceita loading/disabled sem perder o texto editável.

**Dependências:** T-09  
**Arquivos prováveis:** `src/components/CitySearch.tsx`

### T-13 — Exibir e selecionar resultados de cidade

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Exibir resultados de geocodificação e encaminhar a cidade
escolhida ao hook.  
**Critérios de aceite (RF-01; AC-01.1 a AC-01.3, AC-06.3):**

- Cada resultado é identificável e selecionável por teclado e toque.
- Selecionar uma cidade chama a ação de seleção com o `City` correspondente.
- Nenhum resultado administrativo é fabricado no componente; não há
  desambiguação especial de homônimos.

**Dependências:** T-09  
**Arquivos prováveis:** `src/components/CityResults.tsx`

### T-14 — Adicionar botão “Usar localização atual”

**Tipo:** UI · **Prioridade:** P1 · **Tamanho:** P  
**Descrição:** Criar a ação explícita para iniciar o fluxo de geolocalização.  
**Critérios de aceite (RF-06; AC-07.1, AC-06.3):**

- Botão tem nome acessível e não solicita localização antes de ser ativado.
- Enquanto a solicitação estiver ativa, evita disparos repetidos sem desabilitar
  a busca por cidade.
- A ativação chama somente a ação do hook T-10.

**Dependências:** T-10  
**Arquivos prováveis:** `src/components/LocationButton.tsx`

### T-15 — Exibir estado de carregamento acessível

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar apresentação de carregamento reutilizável para busca,
localização e clima.  
**Critérios de aceite (RF-05; AC-05.2, AC-06.4, AC-06.5):**

- Texto comunica qual etapa está em andamento sem depender apenas de cor ou ícone.
- Estado é anunciado semanticamente (`role="status"` ou equivalente) e não
  remove os controles necessários para continuar.

**Dependências:** T-09  
**Arquivos prováveis:** `src/components/states/LoadingState.tsx`

### T-16 — Exibir estado inicial e busca sem resultados

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Distinguir a orientação inicial da busca válida sem resultados.  
**Critérios de aceite (RF-01, RF-05; AC-05.1, AC-05.3):**

- Antes de uma seleção, orientar a busca sem dados meteorológicos fictícios.
- Em busca sem correspondências, informar ausência de cidades e permitir editar
  ou refazer a busca.
- Estado vazio não é apresentado como erro de rede.

**Dependências:** T-09  
**Arquivos prováveis:** `src/components/states/EmptyState.tsx`

### T-17 — Exibir erros e indisponibilidades

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar mensagens acessíveis de erro para busca, clima e
localização.  
**Critérios de aceite (RF-05, RF-06; AC-05.4, AC-05.5, AC-05.7, AC-06.4,
AC-07.4):**

- Mensagem explica a falha em pt-BR e usa semântica de alerta.
- Falha não é representada como sucesso nem mantém dados anteriores visíveis.
- Busca por cidade continua disponível após erro de localização ou clima.

**Dependências:** T-09  
**Arquivos prováveis:** `src/components/states/ErrorState.tsx`

### T-18 — Criar controle de unidade

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Implementar controle semântico que altera a unidade vigente.  
**Critérios de aceite (RF-04; AC-04.1, AC-04.3, AC-06.3):**

- Controle identifica Celsius/Fahrenheit e qual opção está ativa.
- Pode ser operado por teclado e toque, com foco visível.
- Alternar não dispara nova consulta.

**Dependências:** T-11  
**Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`

### T-19 — Renderizar clima atual

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Exibir localização e campos disponíveis do clima atual.  
**Critérios de aceite (RF-02, RF-04; AC-02.1 a AC-02.3, AC-04.1, AC-04.3;
RNF-02, RNF-04):**

- Identificar a localização e renderizar temperatura, sensação térmica, máxima,
  mínima, chance de chuva, umidade e condição quando disponíveis.
- Cada temperatura inclui unidade; valores Celsius são convertidos para unidade
  selecionada e arredondados por T-03.
- Campo ausente ou inválido é identificado como indisponível, nunca como zero.

**Dependências:** T-03, T-07, T-11  
**Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-20 — Renderizar previsão diária de cinco dias

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Criar lista e cartão diário para os dias após hoje no fuso GMT-3.  
**Critérios de aceite (RF-03, RF-04; AC-03.1 a AC-03.4, AC-04.3; RNF-02,
RNF-04):**

- Renderizar datas de `expectedDates` em ordem e não incluir hoje.
- Para cada dia disponível, exibir máxima, mínima, chance de chuva e condição;
  temperaturas mostram a unidade selecionada.
- Dia ou campo ausente fica indicado como indisponível, sem duplicar ou inventar
  valores.

**Dependências:** T-03, T-04, T-05, T-07, T-11  
**Arquivos prováveis:** `src/components/ForecastList.tsx`,
`src/components/ForecastDay.tsx`

## Entrega 5 — Integração em fatias verticais

### T-21 — Integrar a fatia de busca e clima por cidade

**Tipo:** UI · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Compor busca, estados, clima atual, previsão e unidade em uma
primeira tela funcional.  
**Critérios de aceite (RF-01 a RF-05; AC-01.3, AC-02.1, AC-03.1, AC-04.1 a
AC-04.5, AC-05.1 a AC-05.7; RNF-01 a RNF-05):**

- Busca, seleção e consulta exibem o estado correto e apenas dados da seleção
  vigente.
- Tela inicial não mostra previsão fictícia; loading, vazio e erro são
  diferenciados.
- Unidade persistida e clima atual/previsão estão conectados ao estado dos hooks.
- Layout não corta conteúdo nem causa rolagem horizontal nas referências desktop
  e mobile.

**Dependências:** T-09, T-11, T-12, T-13, T-15, T-16, T-17, T-18, T-19, T-20  
**Arquivos prováveis:** `src/App.tsx`, `src/styles/global.css`

### T-22 — Integrar localização atual à aplicação

**Tipo:** UI · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Acrescentar a ação de geolocalização à tela sem alterar o fluxo
alternativo por cidade.  
**Critérios de aceite (RF-06; AC-07.1 a AC-07.7; RNF-03, RNF-09):**

- O botão chama a localização somente após ação explícita.
- Carregamento, permissão negada, precisão aproximada e fallback `Local atual`
  são comunicados pela UI.
- Busca por cidade continua utilizável e prevalece sobre respostas de localização
  que chegarem atrasadas.

**Dependências:** T-14, T-21  
**Arquivos prováveis:** `src/App.tsx`, `src/styles/global.css`

## Entrega 6 — Testes explícitos

### T-23 — Preparar setup do Vitest e Testing Library

**Tipo:** Infra · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Criar o setup que já é referenciado pela configuração do Vitest.  
**Critérios de aceite:**

- `tests/setup.ts` registra os matchers de `@testing-library/jest-dom/vitest`.
- O primeiro teste unitário (T-24) executa usando esse setup e a configuração
  Vitest existente.
- O arquivo não adiciona configuração fora do escopo de testes.

**Dependências:** —  
**Arquivos prováveis:** `tests/setup.ts`

### T-24 — Testar conversão de temperatura

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Criar testes unitários dedicados para conversão e arredondamento.  
**Critérios de aceite (RF-04; AC-04.2, AC-04.6):**

- Cobrir conversões C/F e volta, incluindo `0 °C`, `100 °C` e `-40 °C`.
- Cobrir arredondamento de valores positivos e negativos nos limites `.5`.
- Testar apenas comportamento observável das funções puras.

**Dependências:** T-03, T-23  
**Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`

### T-25 — Testar normalização de busca e datas

**Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Cobrir entrada de busca e datas GMT-3 com testes determinísticos.  
**Critérios de aceite (RF-01, RF-03; AC-01.1, AC-01.4, AC-03.1, AC-03.3):**

- Testar espaços, caixa, acentos e entrada vazia.
- Testar cinco dias seguintes em GMT-3, inclusive virada de dia e data ISO sem
  deslocamento por fuso local.

**Dependências:** T-02, T-04, T-23  
**Arquivos prováveis:** `tests/unit/lib/normalizeCityQuery.test.ts`,
`tests/unit/lib/date.test.ts`

### T-26 — Testar mapeamento de códigos WMO

**Tipo:** Test · **Prioridade:** P1 · **Tamanho:** P  
**Descrição:** Criar testes unitários para códigos conhecidos e desconhecidos.  
**Critérios de aceite (RF-02, RF-03; AC-02.3, AC-03.4, AC-05.5):**

- Validar descrições pt-BR para os grupos de códigos suportados.
- Validar indisponibilidade para código ausente/desconhecido.

**Dependências:** T-05, T-23  
**Arquivos prováveis:** `tests/unit/lib/weatherCode.test.ts`

### T-27 — Testar serviços Open-Meteo com mock de `fetch`

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Testar requisições e normalização dos serviços sem acessar a rede
real.  
**Critérios de aceite (RF-01 a RF-03; AC-01.1, AC-01.2, AC-02.3, AC-03.1 a
AC-03.4, AC-05.5):**

- Mockar `fetch` e conferir URL/parâmetros dos endpoints de geocoding e forecast.
- Cobrir busca vazia, resultados, sem resultados, HTTP inválido e JSON inválido.
- Cobrir campos parciais, percentuais inválidos, dias duplicados e resposta com
  menos de cinco dias.
- Nenhum teste chama Open-Meteo real.

**Dependências:** T-06, T-07, T-23  
**Arquivos prováveis:** `tests/unit/services/openMeteoService.test.ts`

### T-28 — Testar estados e concorrência do hook de clima

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Testar a orquestração de busca/consulta com serviços mockados e
respostas fora de ordem.  
**Critérios de aceite (RF-01, RF-02, RF-05, RF-06; AC-02.2, AC-05.2,
AC-05.4, AC-05.7, AC-05.8, AC-07.5):**

- Cobrir loading, vazio, sucesso, resposta parcial, erro e uma única nova
  tentativa.
- Confirmar que clima anterior fica oculto durante atualização e após falha.
- Confirmar que resposta antiga não sobrescreve busca/cidade mais recente.
- Cobrir timeout total de 30 segundos e que geolocalização só é invocada pela
  ação explícita; mockar serviços, não `fetch` neste teste.

**Dependências:** T-09, T-10, T-23  
**Arquivos prováveis:** `tests/unit/hooks/useWeather.test.tsx`

### T-29 — Testar persistência da unidade

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Validar o hook de preferência com `localStorage` controlado.  
**Critérios de aceite (RF-04; AC-04.1, AC-04.4, AC-04.5):**

- Cobrir padrão Celsius, restauração de Fahrenheit, gravação da troca e valor
  armazenado inválido.
- Cobrir falha de persistência sem perder a unidade durante a sessão.

**Dependências:** T-11, T-23  
**Arquivos prováveis:** `tests/unit/hooks/useTemperatureUnit.test.tsx`

### T-30 — Testar componentes de loading, erro e vazio

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** P  
**Descrição:** Testar os estados visíveis com Testing Library e queries acessíveis.  
**Critérios de aceite (RF-05, RF-06; AC-05.1 a AC-05.5, AC-06.4, AC-06.5,
AC-07.4):**

- Cobrir loading, estado inicial, busca sem resultados e falha.
- Confirmar roles/mensagens sem depender de classes CSS ou somente de cor.
- Confirmar que o estado de erro permite continuar buscando uma cidade.

**Dependências:** T-15, T-16, T-17, T-23  
**Arquivos prováveis:** `tests/unit/components/weather-states.test.tsx`

### T-31 — Testar E2E do fluxo principal e viewport mobile

**Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M  
**Descrição:** Validar o fluxo da cidade de ponta a ponta com dados de rede
interceptados.  
**Critérios de aceite (RF-01 a RF-05; AC-01.1 a AC-01.4, AC-02.1, AC-03.1 a
AC-03.4, AC-04.1 a AC-04.5, AC-05.1 a AC-05.8):**

- Com `page.route`, executar busca, selecionar cidade, verificar clima atual e
  cinco dias, alternar unidade e confirmar persistência após reload.
- Confirmar que uma busca nova não apresenta dados antigos e que erro permite
  nova consulta.
- Executar pelo menos um caminho em viewport mobile de referência.
- O teste é determinístico e não acessa Open-Meteo real.

**Dependências:** T-21, T-23  
**Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`

### T-32 — Testar E2E de geolocalização e disputa de respostas

**Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Cobrir fluxos permitidos/negados da localização e precedência da
busca por cidade.  
**Critérios de aceite (RF-06; AC-07.1 a AC-07.7):**

- Simular permissão concedida, negada, API indisponível e coordenada aproximada.
- Verificar label de localidade/`Local atual`, loading e alternativa por cidade.
- Atrasar a resposta de localização, selecionar uma cidade e provar que a
  resposta atrasada não substitui a seleção.
- Interceptar chamadas de rede e simular coordenadas de teste; não usar a
  localização real do dispositivo.

**Dependências:** T-22, T-23  
**Arquivos prováveis:** `tests/e2e/location.spec.ts`

### T-33 — Testar responsividade, teclado e semântica acessível

**Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Criar regressão E2E para tamanhos de tela e controles acessíveis.  
**Critérios de aceite (RNF-01, RNF-02, RNF-03; AC-06.1 a AC-06.5):**

- Verificar 1920x1080 e 360x800, 390x844, 393x873, 412x915 e 430x932.
- Em cada viewport, confirmar ausência de overflow horizontal e acesso às
  informações e controles essenciais.
- Operar busca, seleção e unidade por teclado; verificar foco visível, nomes
  acessíveis e anúncio de estados.
- Registrar uma validação manual com leitor de tela (VoiceOver ou NVDA) para os
  fluxos e estados principais.

**Dependências:** T-21, T-22, T-23, T-31  
**Arquivos prováveis:** `tests/e2e/responsive-accessibility.spec.ts`

## Entrega 7 — Hardening e observabilidade

### T-34 — Ampliar a matriz Playwright e a instalação de browsers na CI

**Tipo:** Infra · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Executar os fluxos E2E também em Firefox e WebKit/Safari engine.  
**Critérios de aceite (RNF-08; AC-06.6):**

- Preservar Chromium desktop e perfil mobile; adicionar projetos desktop Firefox
  e WebKit.
- Atualizar a instalação de browsers da CI para incluir Firefox, além de
  Chromium/WebKit.
- CI passa nos projetos configurados; registrar validação adicional em Windows,
  Linux e Safari/iOS real nos ambientes disponíveis, sem afirmar cobertura nativa
  baseada somente em emulação.

**Dependências:** T-31, T-33  
**Arquivos prováveis:** `playwright.config.ts`, `.github/workflows/ci.yml`

### T-35 — Medir P95 do fluxo real de busca

**Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M  
**Descrição:** Adicionar um teste de performance opt-in para o ambiente de
referência, separado dos E2E determinísticos de PR.  
**Critérios de aceite (RNF-06; AC-05.6):**

- Medir do acionamento da busca válida à exibição completa do clima atual e da
  previsão, selecionando resultado automaticamente no cenário de teste.
- Com 20 execuções sequenciais reportadas, calcular e imprimir P95; o limite de
  aceite é 30 segundos e cada operação encerra ao atingir o timeout.
- Executar contra a fonte real somente com flag explícita
  (`RUN_LIVE_PERFORMANCE=1`) em rede/dispositivo controlados; a execução normal
  dos testes continua sem chamadas externas.

**Dependências:** T-21, T-31  
**Arquivos prováveis:** `tests/e2e/weather-performance.spec.ts`

### T-36 — Monitorar disponibilidade mensal do fornecedor

**Tipo:** Infra · **Prioridade:** P2 · **Tamanho:** M  
**Descrição:** Criar verificação sintética agendada para acompanhar Open-Meteo
separadamente da disponibilidade da aplicação.  
**Critérios de aceite (RNF-07):**

- Workflow agendado e executável manualmente consulta geocoding e forecast com
  uma cidade/coordenada fixa de teste, nunca com dados de usuários.
- Cada execução registra timestamp, endpoint, sucesso/falha e latência no resumo
  do workflow, com histórico suficiente para calcular a disponibilidade em uma
  janela mensal.
- O relatório compara o resultado observado com a meta de 99%; não declara a
  meta cumprida antes de haver uma janela mensal de evidência.
- A checagem não bloqueia a CI normal de PR e não adiciona API key ou novo
  fornecedor.

**Dependências:** T-06, T-07  
**Arquivos prováveis:** `.github/workflows/weather-availability.yml`,
`scripts/check-weather-availability.mjs`

## Rastreabilidade

### Requisitos funcionais

| Requisito | Tarefas correspondentes |
|---|---|
| RF-01 — Buscar e selecionar cidades | T-02, T-06, T-09, T-12, T-13, T-16, T-25, T-27, T-28, T-31 |
| RF-02 — Consultar o clima atual | T-01, T-05, T-07, T-09, T-19, T-27, T-28, T-31 |
| RF-03 — Consultar a previsão de cinco dias | T-01, T-04, T-05, T-07, T-20, T-25, T-26, T-27, T-31 |
| RF-04 — Alternar Celsius e Fahrenheit | T-01, T-03, T-11, T-18, T-24, T-29, T-31 |
| RF-05 — Comunicar estados da consulta | T-09, T-15, T-16, T-17, T-28, T-30, T-31, T-35 |
| RF-06 — Consultar pela localização atual | T-08, T-10, T-14, T-17, T-28, T-32, T-33 |

Todos os requisitos funcionais RF-01 a RF-06 têm implementação e validação
associadas; nenhum RF ficou sem tarefa.

### Requisitos não funcionais

| Requisito | Tarefas correspondentes |
|---|---|
| RNF-01 — Responsividade | T-21, T-22, T-33 |
| RNF-02 — Clareza e identificação | T-13, T-19, T-20, T-21, T-22, T-33 |
| RNF-03 — Acessibilidade | T-12 a T-18, T-30, T-33 |
| RNF-04 — Integridade dos dados | T-03 a T-07, T-09, T-19, T-20, T-24 a T-28 |
| RNF-05 — Resiliência | T-09, T-10, T-15 a T-17, T-27 a T-31 |
| RNF-06 — P95 e timeout de 30 segundos | T-09, T-28, T-35 |
| RNF-07 — Atualidade e disponibilidade | T-07, T-09, T-36 |
| RNF-08 — pt-BR e compatibilidade | T-05, T-12, T-19, T-20, T-33, T-34 |
| RNF-09 — Privacidade da localização | T-08, T-10, T-14, T-32, T-36 |

RNF-07 depende da disponibilidade de um fornecedor externo. T-36 coleta
evidências, mas a aplicação não pode garantir sozinha um SLO mensal do
Open-Meteo; não declarar o alvo atendido sem dados observados.

## Sequência sugerida em fatias verticais

1. **Busca por cidade visível:** T-01 a T-07, T-09, T-11 a T-21, priorizando
   primeiro a seleção de cidade, clima atual e previsão em Celsius; incluir a
   alternância de unidade antes de fechar a primeira fatia.
2. **Localização atual:** T-08, T-10, T-14 e T-22; a cidade continua sendo
   alternativa em todas as falhas.
3. **Confiança funcional:** T-23 a T-33, com unitários, mocks de serviço, estados
   de UI, concorrência, E2E principal, E2E de localização e acessibilidade.
4. **Compatibilidade e métricas:** T-34 e T-35 para browsers/P95; T-36 em
   execução contínua para observar a disponibilidade externa ao longo do mês.

## Prompt para o Coding Agent — T-01

```text
Implemente somente a tarefa T-01: definir os tipos compartilhados do domínio
Weather App em TypeScript strict.

Contexto:
- O projeto usa TypeScript strict, React e Open-Meteo.
- A especificação e o plano técnico são as fontes de verdade:
  - specs/weather-app-spec.md
  - plans/weather-app-plan.md
- O domínio normalizado guarda temperaturas em Celsius; conversão e persistência
  da unidade pertencem a outras tarefas.
- Campos meteorológicos que a fonte não fornece devem poder ficar ausentes.
- Coordenadas de geolocalização são transitórias e nunca devem fazer parte de
  estado persistido, histórico ou snapshot de clima.

Escopo:
- Criar somente `src/types/weather.ts`.
- Exportar os tipos `TemperatureUnit`, `LocationSource`, `City`, `Coordinates`,
  `WeatherLocation`, `WeatherCondition`, `CurrentWeather`, `ForecastDay` e
  `WeatherSnapshot`.
- `TemperatureUnit` deve permitir apenas "C" ou "F"; `LocationSource`, apenas
  "city" ou "current".
- `City` deve conter id numérico, nome, latitude e longitude, com região e país
  opcionais.
- `Coordinates` deve conter latitude e longitude e ser usado somente como
  argumento transitório de serviço.
- `WeatherLocation` deve conter id, label, source, indicação de aproximação e
  precisão opcional, sem latitude/longitude.
- `CurrentWeather` deve representar sourceTime e temperatura, mínima, máxima,
  sensação térmica, umidade, probabilidade de chuva e condição como campos
  opcionais.
- `ForecastDay` deve conter data e máxima, mínima, probabilidade de chuva e
  condição opcionais.
- `WeatherSnapshot` deve conter current opcional, nextFiveDays, expectedDates e
  fetchedAt; não incluir coordenadas.

Critérios de aceite:
1. Os tipos exportados correspondem ao modelo acima e ao plano.
2. Dados opcionais não usam zero ou strings fictícias como substituto.
3. Coordenadas não aparecem em WeatherLocation ou WeatherSnapshot.
4. Não adicionar lógica de runtime, chamadas de rede, componentes ou testes.
5. Não usar `any`; preservar compatibilidade com TypeScript strict.

Arquivos:
- Criar: `src/types/weather.ts`
- Não editar outros arquivos nesta tarefa.
```
