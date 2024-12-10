
export enum Relations {
  CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT = 'RO:0002304',
  CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT = 'RO:0002305',
  CONSTITUTIVELY_UPSTREAM_OF = 'RO:0012009',
  DIRECTLY_NEGATIVELY_REGULATES = 'RO:0002630',
  DIRECTLY_POSITIVELY_REGULATES = 'RO:0002629',
  HAS_INPUT = 'RO:0002233',
  HAS_OUTPUT = 'RO:0002234',
  INDIRECTLY_NEGATIVELY_REGULATES = 'RO:0002407',
  INDIRECTLY_POSITIVELY_REGULATES = 'RO:0002409',
  IS_SMALL_MOLECULE_INHIBITOR_OF = 'RO:0012006',
  IS_SMALL_MOLECULE_ACTIVATOR_OF = 'RO:0012005',
  NEGATIVELY_REGULATES = 'RO:0002212',
  POSITIVELY_REGULATES = 'RO:0002213',
  PROVIDES_INPUT_FOR = 'RO:0002413',
  REMOVES_INPUT_FOR = 'RO:0012010'
}

interface Relation {
  lineStyle: string;
  glyph: string;
  label: string;
  color: string;
  width: number;
}

type RelationMap = {
  [key in Relations]: Relation;
};

export const STYLES = {
  SIZES: {
    DEFAULT: 5 // Maybe more later
  },
  COLORS: {
    BLUE: '#6495ED',
    PURPLE: '#800080',
    DARK_SLATE: '#2F4F4F',
    LIGHT_RED: '#fF9999',
    RED: '#FF0000',
    GREEN: '#008800',
    LIGHT_GREEN: '#95e095',
    PINK: '#ED6495',
    DARK_BLUE: '#483D8B',
    LIGHT_BLUE: '#add8e6',
    WHITE: '#FFFAFA',
    BLACK: 'black',
    GREY: '#CCCCCC'
  },
  LINE_STYLES: {
    SOLID: 'solid',
    DASHED: 'dashed'
  },
  GLYPHS: {
    NONE: null,
    TEE: 'tee',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    DIAMOND: 'diamond',
    CIRCLE: 'circle',
    CIRCLE_TRIANGLE: 'circle-triangle'
  }
};

// Map of relations to their style configurations
export const RELATION_MAP: RelationMap = {
  [Relations.CAUSALLY_UPSTREAM_OF_POSITIVE_EFFECT]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TRIANGLE,
    label: 'causally upstream of, positive effect',
    color: STYLES.COLORS.LIGHT_GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.CAUSALLY_UPSTREAM_OF_NEGATIVE_EFFECT]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TEE,
    label: 'causally upstream of, negative effect',
    color: STYLES.COLORS.LIGHT_RED,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.CONSTITUTIVELY_UPSTREAM_OF]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.CIRCLE,
    label: 'constitutively upstream of',
    color: STYLES.COLORS.LIGHT_GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.DIRECTLY_NEGATIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.TEE,
    label: 'directly negatively regulates',
    color: STYLES.COLORS.RED,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.DIRECTLY_POSITIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.TRIANGLE,
    label: 'directly positively regulates',
    color: STYLES.COLORS.GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.HAS_INPUT]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.CIRCLE,
    label: 'has input',
    color: STYLES.COLORS.BLUE,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.HAS_OUTPUT]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.CIRCLE,
    label: 'has output',
    color: STYLES.COLORS.PINK,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.INDIRECTLY_NEGATIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TEE,
    label: 'indirectly negatively regulates',
    color: STYLES.COLORS.RED,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.INDIRECTLY_POSITIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TRIANGLE,
    label: 'indirectly positively regulates',
    color: STYLES.COLORS.GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.IS_SMALL_MOLECULE_INHIBITOR_OF]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.TEE,
    label: 'is small molecule inhibitor of',
    color: STYLES.COLORS.RED,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.IS_SMALL_MOLECULE_ACTIVATOR_OF]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.TRIANGLE,
    label: 'is small molecule activator of',
    color: STYLES.COLORS.GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.NEGATIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TEE,
    label: 'negatively regulates',
    color: STYLES.COLORS.RED,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.POSITIVELY_REGULATES]: {
    lineStyle: STYLES.LINE_STYLES.DASHED,
    glyph: STYLES.GLYPHS.TRIANGLE,
    label: 'positively regulates',
    color: STYLES.COLORS.GREEN,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.PROVIDES_INPUT_FOR]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.CIRCLE_TRIANGLE,
    label: 'provides input for',
    color: STYLES.COLORS.PURPLE,
    width: STYLES.SIZES.DEFAULT
  },
  [Relations.REMOVES_INPUT_FOR]: {
    lineStyle: STYLES.LINE_STYLES.SOLID,
    glyph: STYLES.GLYPHS.SQUARE,
    label: 'removes input for',
    color: STYLES.COLORS.LIGHT_RED,
    width: STYLES.SIZES.DEFAULT
  }
};

export function glyph(relation) {
  if (!relation) {
    console.warn('No relation provided to glyph function');
    return { glyph: STYLES.GLYPHS.NONE, label: '', color: STYLES.COLORS.GREY };
  }

  const config = RELATION_MAP[relation];
  if (!config) {
    console.warn(`No glyph found for relation '${relation}'`);
    return { glyph: STYLES.GLYPHS.NONE, label: relation, color: STYLES.COLORS.GREY };
  }

  return config;
}


export const GLYPH_STYLES = STYLES;