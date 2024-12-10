import { Relations } from "./relations";

export const LEGEND_COLUMNS = {
  regulation: {
    [Relations.DIRECTLY_POSITIVELY_REGULATES]: 'direct positive regulation/activation',
    [Relations.DIRECTLY_NEGATIVELY_REGULATES]: 'direct negative regulation/inhibition',
    [Relations.INDIRECTLY_POSITIVELY_REGULATES]: 'indirect positive regulation',
    [Relations.INDIRECTLY_NEGATIVELY_REGULATES]: 'indirect negative regulation'
  },
  input: {
    [Relations.PROVIDES_INPUT_FOR]: 'provides input for',
    [Relations.REMOVES_INPUT_FOR]: 'removes input for',
    [Relations.HAS_INPUT]: 'input of',
    [Relations.HAS_OUTPUT]: 'has output'
  },
  upstream: {
    [Relations.CONSTITUTIVELY_UPSTREAM_OF]: 'constitutively upstream',
    [Relations.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT]: 'upstream positive effect',
    [Relations.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT]: 'upstream negative effect'
  }
};
