# Discovery — Aplicação de previsão do tempo

## Briefing analisado

A aplicação deve permitir que usuários busquem cidades, consultem o clima atual,
vejam a previsão dos próximos cinco dias, alternem entre Celsius e Fahrenheit e
usem o produto em dispositivos móveis.

## Requisitos funcionais

Os requisitos abaixo estão explícitos ou são necessários para viabilizar as
capacidades descritas no briefing:

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise uma cidade e
  escolha a localização para a qual deseja consultar o clima. O formato da busca
  e a desambiguação de cidades ainda precisam ser definidos.
- **RF-02 — Consultar clima atual:** apresentar as condições atuais da cidade
  selecionada. Os dados específicos que compõem essa apresentação ainda precisam
  ser definidos.
- **RF-03 — Consultar previsão:** apresentar uma previsão para cinco dias da
  cidade selecionada. A inclusão do dia atual e os dados exibidos por dia ainda
  precisam ser definidos.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius
  e Fahrenheit para as temperaturas apresentadas. Aplicar a seleção de forma
  consistente ao clima atual e à previsão é uma expectativa a confirmar.

## Requisitos não funcionais

- **RNF-01 — Uso em dispositivos móveis:** a aplicação deve ser utilizável em
  dispositivos móveis, incluindo as ações de buscar uma cidade, consultar as
  condições e alternar a unidade. Os tamanhos de tela e navegadores suportados
  não foram especificados.
- **RNF-02 — Clareza da unidade:** cada temperatura deve indicar claramente se
  está em Celsius ou Fahrenheit, para evitar ambiguidade ao alternar unidades.
  Essa necessidade é implícita no requisito de alternância.

Os seguintes atributos de qualidade são relevantes, mas não têm metas definidas
no briefing e precisam de decisão antes de serem tratados como requisitos:

- **Desempenho:** tempo aceitável para buscar uma cidade e carregar o clima.
- **Atualidade e disponibilidade:** frequência de atualização dos dados e nível
  esperado de disponibilidade do serviço.
- **Compatibilidade:** navegadores, sistemas operacionais e tamanhos mínimos de
  tela suportados.
- **Acessibilidade e localização:** padrão de acessibilidade e idiomas/regiões
  que a aplicação deve atender.
- **Resiliência:** comportamento esperado durante carregamento, falhas de rede,
  indisponibilidade da fonte de dados ou buscas sem resultados.

## Riscos

| Risco | Impacto possível | Mitigação a considerar |
|---|---|---|
| Cidades com nomes iguais ou semelhantes não serem diferenciadas. | O usuário pode consultar a previsão de uma localização incorreta. | Definir como identificar resultados, por exemplo, exibindo região e país quando necessário. |
| A fonte externa de dados estar indisponível, lenta ou limitar consultas. | O clima ou a previsão podem não carregar ou estar desatualizados. | Selecionar e validar a fonte de dados; definir como comunicar falhas e dados desatualizados. |
| “Cinco dias” ser interpretado de formas diferentes. | A previsão pode incluir um intervalo diferente do esperado. | Definir o intervalo e o fuso horário usados para cada cidade. |
| A troca de unidade não ser aplicada a todos os valores ou ser exibida sem identificação. | O usuário pode interpretar temperaturas incorretamente. | Definir o escopo da preferência e exigir unidade visível em todos os valores. |
| O layout móvel dificultar busca, leitura ou interação com os controles. | A aplicação pode não ser utilizável em telas pequenas. | Definir dispositivos-alvo e validar os fluxos principais em telas móveis. |
| Os dados apresentados no clima atual e na previsão não atenderem às expectativas dos usuários. | A funcionalidade pode parecer incompleta apesar de carregar dados. | Confirmar quais informações devem aparecer em cada visualização. |

## Perguntas em aberto

1. A busca deve aceitar nomes parciais, oferecer sugestões ou exigir o nome
   completo? Como o usuário distingue cidades homônimas (região, estado ou país)?
2. Quais países/regiões e idiomas devem ser suportados? A busca deve aceitar
   nomes localizados e caracteres acentuados?
3. Quais informações devem aparecer no clima atual (por exemplo, temperatura,
   sensação térmica, condição, umidade e vento)?
4. Quais informações devem aparecer em cada dia da previsão (por exemplo,
   mínima/máxima, condição e chance de precipitação)?
5. Os cinco dias incluem o dia atual ou são os cinco dias seguintes? Qual fuso
   horário define a mudança de dia?
6. Qual unidade deve ser usada inicialmente? A escolha deve afetar todas as
   temperaturas e ser mantida após recarregar ou reabrir a aplicação?
7. O usuário consulta uma cidade por vez? Deve haver localização automática,
   cidades favoritas ou histórico de buscas? Esses recursos não estão no
   briefing e não devem ser presumidos como escopo.
8. Quais dispositivos, navegadores, orientações e larguras de tela móveis devem
   ser suportados?
9. Quais são as metas aceitáveis de tempo de resposta, atualização dos dados e
   disponibilidade?
10. Qual nível de acessibilidade é esperado e como a aplicação deve informar
    carregamento, ausência de resultados e falhas de rede ou de dados?