const STYLES = {
    SIZES: {
        DEFAULT: 5 // Maybe more later
    },
    COLORS: {
        BLUE: '#6495ED',
        DARK_SLATE: '#2F4F4F',
        RED: '#FF0000',
        GREEN: '#008000',
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
        DIAMOND: 'diamond',
        CIRCLE: 'circle',
        CIRCLE_TRIANGLE: 'circle-triangle'
    }
};

// Map of relations to their style configurations
const RELATION_MAP = {
    'instance_of': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.NONE,
        label: 'activity',
        color: STYLES.COLORS.WHITE,
        width: STYLES.SIZES.DEFAULT
    },
    'annotation': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.DIAMOND,
        label: 'annotation',
        color: STYLES.COLORS.DARK_BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002411': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.NONE,
        label: 'causally upstream of',
        color: STYLES.COLORS.DARK_BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002304': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.NONE,
        label: 'causally upstream of, positive effect',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002305': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.NONE,
        label: 'causally upstream of, negative effect',
        color: STYLES.COLORS.RED,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002418': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.NONE,
        label: 'causally upstream of or within',
        color: STYLES.COLORS.DARK_BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0012009': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.CIRCLE,
        label: 'constitutively upstream of',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002406': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TRIANGLE,
        label: 'directly activates',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002408': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TEE,
        label: 'directly inhibits',
        color: STYLES.COLORS.RED,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002630': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TEE,
        label: 'directly negatively regulates',
        color: STYLES.COLORS.RED,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002629': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TRIANGLE,
        label: 'directly positively regulates',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002413': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.CIRCLE_TRIANGLE,
        label: 'directly provides input for',
        color: STYLES.COLORS.LIGHT_BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'BFO:0000051': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.NONE,
        label: 'has input',
        color: STYLES.COLORS.BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002233': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.NONE,
        label: 'has output',
        color: STYLES.COLORS.PINK,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002234': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.NONE,
        label: 'has part',
        color: STYLES.COLORS.BLUE,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0012005': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TEE,
        label: 'is small molecule activator',
        color: STYLES.COLORS.RED,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0012004': {
        lineStyle: STYLES.LINE_STYLES.SOLID,
        glyph: STYLES.GLYPHS.TRIANGLE,
        label: 'is small molecule regulator',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002212': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.TEE,
        label: 'negatively regulates',
        color: STYLES.COLORS.RED,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002213': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.TRIANGLE,
        label: 'positively regulates',
        color: STYLES.COLORS.GREEN,
        width: STYLES.SIZES.DEFAULT
    },
    'RO:0002211': {
        lineStyle: STYLES.LINE_STYLES.DASHED,
        glyph: STYLES.GLYPHS.NONE,
        label: 'regulates',
        color: STYLES.COLORS.DARK_SLATE,
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
