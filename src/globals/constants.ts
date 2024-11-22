export const curieUrl = "https://raw.githubusercontent.com/prefixcommons/biocontext/master/registry/go_context.jsonld";

export const legend = {
  left: [
    {
      id: 'direct_regulation',
      label: 'Direct Regulation'
    },
    {
      id: 'indirect_regulation',
      label: 'Indirect Regulation or Unknown Mechanism'
    }
  ],
  middle: [
    {
      id: 'positive_regulation',
      label: 'Positive Regulation'
    }, {
      id: 'negative_regulation',
      label: 'Negative Regulation'
    }, {
      id: 'provides_input_for',
      label: 'Provides Input For'
    }, {
      id: 'neutral',
      label: 'Unknown/Neutral'
    }
  ],
  right: [
    {
      id: 'input_of',
      label: 'Input Of'
    }, {
      id: 'has_output',
      label: 'Has Output'
    }
  ]
}