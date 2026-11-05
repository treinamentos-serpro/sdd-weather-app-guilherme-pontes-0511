# Weather App — Plano Técnico

Este plano deriva da [especificação do produto](../specs/weather-app-spec.md) e
define decisões para a etapa de implementação. A aplicação consulta uma
localização por vez, sem backend próprio. As referências a RF, RNF e AC abaixo
mantêm cada decisão rastreável aos requisitos.

## Architecture (Overview)

```text
App
├── SearchForm ── CityResults ─┐
├── LocationButton ────────────┤
├── TemperatureUnitToggle      │
└── CurrentWeather + Forecast  │
                               ▼
                         useWeather
                         ├── useTemperatureUnit
                         ├── geolocationService ── Browser Geolocation API
                         └── openMeteoService
                             ├── Geocoding API
                             └── Forecast API
                               │
               normalize + validate + map WMO codes
                               │
                               └── normalized view state
```

- **Apresentação:** componentes React recebem estado normalizado, exibem dados
  atuais e previsão, e não conhecem URLs nem formatos da API.
- **Orquestração:** `useWeather` coordena busca, seleção, geolocalização e
  consulta meteorológica. Uma identificação crescente da operação e
  `AbortController` impedem que respostas antigas sobrescrevam a localização
  mais recente.
- **Acesso a dados:** `openMeteoService` contém as chamadas HTTP e valida as
  respostas; `geolocationService` encapsula a API do navegador.
- **Funções puras:** conversão de temperatura, normalização de busca, cálculo
  das datas GMT-3 e tradução de códigos WMO ficam em `lib/`, facilitando testes.
- **Persistência:** somente a unidade escolhida é salva no `localStorage`.
  Localização e dados meteorológicos não são persistidos.

Essa separação atende RF-01 a RF-06; a substituição de consultas e o descarte
de respostas atrasadas atendem AC-02.2 e AC-07.5.

## Tech Stack

| Camada | Tecnologia | Uso |
|---|---|---|
| Linguagem | TypeScript 6, modo `strict` | Contratos explícitos para domínio e respostas normalizadas. |
| UI | React 19 + Vite 8 | Aplicação client-side e servidor/build. |
| Estilos | Tailwind CSS 3 | Tema dark glassmorphism e layout responsivo. |
| Dados | Open-Meteo Geocoding + Forecast | Busca de localidades e dados meteorológicos, sem API key. |
| APIs do navegador | Geolocation e `localStorage` | Localização somente sob ação explícita e preferência de unidade. |
| Testes | Vitest, Testing Library e Playwright | Testes unitários/componentes e fluxos E2E. |
| Qualidade | Biome | Lint e formatação conforme scripts do projeto. |
| Pacotes | pnpm 11; Node.js >=22 | Gerenciador e runtime já adotados pelo repositório. |

As versões instaladas estão declaradas em `package.json`; não é necessária uma
dependência de estado, de rede ou de formatação adicional. A interface e as
descrições de condições meteorológicas serão exclusivamente pt-BR (RNF-08).

## Project Structure

```text
src/
├── components/
│   ├── CitySearch.tsx
│   ├── CityResults.tsx
│   ├── LocationButton.tsx
│   ├── TemperatureUnitToggle.tsx
│   ├── CurrentWeather.tsx
│   ├── ForecastList.tsx
│   └── states/
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       └── LoadingState.tsx
├── hooks/
│   ├── useWeather.ts
│   └── useTemperatureUnit.ts
├── services/
│   ├── openMeteoService.ts
│   └── geolocationService.ts
├── lib/
│   ├── normalizeCityQuery.ts
│   ├── temperature.ts
│   ├── date.ts
│   └── weatherCode.ts
├── types/
│   └── weather.ts
├── styles/
│   └── global.css
├── App.tsx
└── main.tsx

tests/
├── setup.ts
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── services/
└── e2e/
    └── weather-app.spec.ts
```

Componentes permanecem em arquivos separados; `services/` é a única camada que
conhece os endpoints. A organização dos testes segue a configuração Vitest
(`tests/unit/`) e Playwright (`tests/e2e/`) já existente.

## Data Model

Os tipos abaixo representam o domínio normalizado, não a resposta bruta do
fornecedor. Campos opcionais significam indisponibilidade, nunca zero inventado.

```ts
export type TemperatureUnit = "C" | "F";
export type LocationSource = "city" | "current";

export interface City {
  id: number;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherLocation {
  id: string;
  label: string;
  region?: string;
  source: LocationSource;
  isApproximate: boolean;
  accuracyMeters?: number;
}

export interface WeatherCondition {
  code: number;
  description: string;
}

export interface CurrentWeather {
  sourceTime?: string;
  temperatureC?: number;
  minimumC?: number;
  maximumC?: number;
  feelsLikeC?: number;
  humidityPercent?: number;
  rainProbabilityPercent?: number;
  condition?: WeatherCondition;
}

export interface ForecastDay {
  date: string;
  minimumC?: number;
  maximumC?: number;
  rainProbabilityPercent?: number;
  condition?: WeatherCondition;
}

export interface WeatherSnapshot {
  current?: CurrentWeather;
  nextFiveDays: ForecastDay[];
  expectedDates: string[];
  fetchedAt: string;
}
```

`expectedDates` contém as cinco datas esperadas em GMT-3; a lista de previsões
pode conter menos dias. A interface cruza ambas para indicar dias e campos
indisponíveis sem duplicar ou fabricar valores (AC-03.3, AC-03.4 e AC-05.5).
Coordenadas são parâmetros transitórios da consulta, não parte de
`WeatherLocation` nem de `WeatherSnapshot`. Para a unidade, os valores-base
permanecem em Celsius; somente a apresentação é convertida (RF-04, P-01).

## Data Flow

1. `CitySearch` valida espaços em branco e não chama a API para uma entrada
   vazia. `normalizeCityQuery` remove diferenças de caixa e diacríticos para a
   busca, sem alterar o texto apresentado ao usuário.
2. `useWeather` invalida a operação anterior, oculta os dados meteorológicos e
   solicita cidades ao serviço de geocodificação.
3. Resultados válidos são exibidos para seleção explícita. Uma busca sem
   correspondências resulta em estado vazio, distinto de erro.
4. Ao selecionar uma cidade, suas coordenadas são passadas ao serviço de clima.
   A resposta é validada e normalizada em Celsius; o clima atual e a previsão
   vêm de uma única consulta.
5. Para localização atual, o botão inicia a geolocalização. Só após permissão e
   obtenção das coordenadas é iniciada a consulta meteorológica; a busca por
   cidade continua disponível como alternativa.
6. `useWeather` publica dados completos ou parciais. A UI identifica
   indisponibilidades por campo/dia. `useTemperatureUnit` converte todos os
   campos de temperatura na renderização, sem nova chamada à API.
7. Uma operação mais recente invalida a anterior, mesmo se a API de
   geolocalização ou uma resposta HTTP antiga não puder ser cancelada.

## External APIs

### Geocoding — Open-Meteo

```text
GET https://geocoding-api.open-meteo.com/v1/search
    ?name=<consulta codificada>
    &count=10
    &language=pt
    &format=json
```

Usar `URLSearchParams` para codificar parâmetros. Remover espaços externos e
normalizar acentos/caixa na consulta; usar os metadados de localidade da resposta
para aceitar lugares povoados (`feature_code` da família `PPL`) e não apresentar
países, regiões ou divisões administrativas como cidades independentes. Região
e país podem contextualizar um resultado. Não implementar desambiguação especial
de homônimos (RF-01, AC-01.1, AC-01.2).

### Forecast — Open-Meteo

```text
GET https://api.open-meteo.com/v1/forecast
    ?latitude=<latitude>
    &longitude=<longitude>
    &current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code
    &hourly=precipitation_probability
    &daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code
    &forecast_days=6
    &timezone=America/Sao_Paulo
    &temperature_unit=celsius
```

O fuso enviado é a referência GMT-3 da especificação, não o fuso automático da
cidade consultada. Solicitar seis dias para obter hoje e os cinco dias seguintes;
descartar o dia atual e conservar datas únicas em ordem cronológica. Usar os
dados `daily` do dia atual para mínima/máxima do cartão atual e o valor horário
de precipitação correspondente ao horário atual para a chance de chuva atual.
Os cinco cartões seguintes usam máxima, mínima, probabilidade máxima de chuva e
código WMO diário (RF-02, RF-03, AC-03.1).

Normalizar os códigos WMO para descrições pt-BR em `weatherCode.ts`; código
ausente ou não mapeado é condição indisponível. Validar `Response.ok`, JSON,
coordenadas, datas, números finitos e percentuais no limite de 0 a 100 antes de
publicar dados. Não há endpoint próprio de reverse geocoding nesta integração:
na consulta por coordenadas, usar um nome de localidade apenas se já estiver
disponível; caso contrário, mostrar **Local atual** (RF-06).

## State Management

Não introduzir biblioteca global: o estado vive em hooks React.

- `useWeather` mantém uma união discriminada de estados: `idle`, `searching`,
  `results`, `locating`, `loadingWeather`, `ready`, `empty` e `error`. Os estados
  de carregamento carregam a etapa ativa; `ready` admite dados parciais.
- O hook mantém o identificador da operação e o `AbortController` ativos.
  Resultados só podem alterar a UI se ainda pertencerem à operação atual.
- `CitySearch` controla o texto editável; `useWeather` controla resultados,
  localização selecionada e consulta em andamento.
- `useTemperatureUnit`, no nível de `App`, inicia em Celsius, valida e restaura
  `weather-app:temperature-unit` do `localStorage`, e persiste mudanças entre
  sessões. Valor ausente/inválido volta a Celsius. A mudança atualiza todos os
  rótulos e temperaturas sem alterar os valores-base nem refazer a consulta.
- Não manter cache de clima ou de coordenadas: cada nova seleção busca dados
  atuais; `fetchedAt` registra o recebimento bem-sucedido. Isso evita servir
  dados com mais de 30 minutos e não persiste localização. A unidade é a única
  preferência persistida (AC-05.8, RNF-07, RNF-09).

## Error Handling

- **Entrada vazia:** orientação para informar uma cidade; nenhuma requisição.
- **Sem resultados:** estado vazio com opção de editar/refazer a busca; não é
  apresentado como falha de rede.
- **Permissão/API de localização negada, indisponível ou expirada:** mensagem
  acessível e busca por cidade mantida. A API só é chamada após interação
  explícita; `accuracy` é preservada para identificar uma localização
  aproximada. Coordenadas não são gravadas nem registradas em logs.
- **Falha de rede, resposta HTTP inválida, payload inválido ou timeout:** uma
  única nova tentativa da etapa remota com o mesmo limite de 30 segundos. Se
  falhar novamente, encerrar o loading, explicar a falha em pt-BR e permitir
  nova busca. Não repetir por cancelamento de uma operação substituída.
- **Resposta parcial:** exibir cada campo/dia válido e marcar ausências como
  indisponíveis. Não converter ausências em zero. Uma resposta sem dado
  meteorológico utilizável resulta em erro de dados insuficientes.
- **Atualização/troca de localização:** ocultar imediatamente o clima anterior;
  mantê-lo oculto se a consulta falhar (RF-05, AC-05.4 a AC-05.8).
- **Prazo:** medir o fluxo válido de cidade desde a ação de busca até os dados
  completos visíveis, com limite de 30 segundos e retry dentro desse limite.
  Ao expirar, abortar a chamada ativa e mostrar erro. A geolocalização também
  deve encerrar loading em até 30 segundos.
- Erros de serviço são tipados e convertidos em mensagens de interface na
  orquestração; cancelamentos obsoletos são descartados, não mascarados como
  sucesso. Se `localStorage` estiver indisponível, manter a unidade na sessão e
  informar que a preferência não pôde ser persistida.

## Testing Strategy

### Unitários e componentes

Usar Vitest + Testing Library em `tests/unit/`; mockar `src/services/`, sem
chamadas reais às APIs.

- Testar normalização de consulta (espaços, caixa e acentos), busca vazia,
  ausência de resultados e filtro de cidades.
- Testar mapeamento de resposta Open-Meteo, códigos WMO, campos ausentes,
  percentuais inválidos, dias duplicados/ausentes e seleção dos cinco dias
  seguintes em GMT-3, inclusive na virada do dia.
- Testar conversão C/F e volta, valores de referência `0 °C`, `100 °C`,
  `-40 °C`, arredondamento e unidade em todas as temperaturas; testar restauração
  e persistência da preferência.
- Testar loading, vazio, erro, retry único, timeout e resposta parcial. Usar
  respostas adiadas para provar que uma operação obsoleta não substitui a atual.
- Testar que geolocalização só ocorre após clique, que permissão negada mantém a
  busca por cidade e que uma seleção de cidade vence uma localização atrasada.
- Consultar controles por roles/labels acessíveis e verificar mensagens de
  estado e foco por teclado.

### E2E e compatibilidade

Usar Playwright em `tests/e2e/`, interceptando chamadas com `page.route` para
resultados determinísticos. Cobrir: busca/seleção → clima atual e cinco dias →
alternância de unidade → recarga e restauração da unidade; sem resultados;
falha e retry; resposta parcial; troca rápida de localização; localização
permitida, negada e aproximada. Testar desktop em 1920x1080 e as referências
móveis 360x800, 390x844, 393x873, 412x915 e 430x932, incluindo teclado, foco,
leitura dos estados e ausência de rolagem horizontal (RNF-01, RNF-03).

A configuração atual do Playwright cobre Chromium desktop e o perfil iPhone 13.
Completar a matriz de execução para Firefox e WebKit/Safari, e validar Windows,
Linux e iOS nos ambientes disponíveis para satisfazer RNF-08. Medir o P95 do
fluxo desde a busca até o clima completo sob condições de rede/dispositivo
controladas; mocks verificam a lógica do limite de 30 segundos, mas não
substituem a medição de disponibilidade/latência da fonte externa (RNF-06,
RNF-07). Comandos do repositório: `pnpm test`, `pnpm test:e2e`, `pnpm lint` e
`pnpm build`.

## Risks & Trade-offs

| Risco ou decisão | Mitigação / trade-off | Referência |
|---|---|---|
| Ambiguidade entre cidades homônimas. | Aceitar a limitação definida; não criar lógica especial de desambiguação. | R-01, RF-01 |
| API externa lenta, indisponível ou com limites de uso. | Timeout, uma tentativa adicional, erro explícito e nova consulta possível. A meta de 99% inclui o fornecedor e deve ser acompanhada separadamente; o app client-side não a garante sozinho. | R-02, RNF-06, RNF-07 |
| Busca de cidades depende da classificação e normalização oferecidas pelo geocoder. | Filtrar metadados de localidades povoadas e testar variações de acentos/caixa com fixtures; não retornar divisões administrativas como cidades. | RF-01, AC-01.1, AC-01.2 |
| API de geolocalização fornece coordenadas, não necessariamente o nome da localidade. | Evitar um segundo fornecedor e exposição adicional de coordenadas; usar **Local atual** quando um nome não estiver disponível e comunicar aproximação quando indicada. | RF-06, RNF-09, R-09, R-10 |
| A fonte pode omitir ou alterar campos meteorológicos. | Validar em runtime e renderizar dados parciais com indisponibilidades explícitas; códigos WMO desconhecidos não recebem descrição inventada. | R-06, RF-02, RF-03 |
| Fuso da cidade diverge do critério fixo GMT-3. | Solicitar `America/Sao_Paulo`, descartar hoje e testar limites de data; não usar o fuso automático da localização. | R-03, AC-03.1 |
| Preferência local pode não ser persistível em certos modos do navegador. | Manter a seleção durante a sessão e comunicar a falha de persistência; os dados meteorológicos continuam funcionais. | RF-04, AC-04.5 |
| Sem cache melhora a atualidade, mas aumenta chamadas em novas consultas. | Não cachear coordenadas nem clima; conversão de unidade não gera chamadas. A escolha favorece privacidade e frescor em relação à redução de tráfego. | AC-05.8, RNF-07, RNF-09 |
