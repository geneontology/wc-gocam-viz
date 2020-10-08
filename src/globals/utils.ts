
export function glyph(relation) {
    switch (relation) {
        case "BFO:0000050":
            return { glyph: null, label: "part of", color: '#add8e6' };
        case "BFO:0000051":
            return { glyph: null, label: "has part", color: '#6495ED' };
        case "BFO:0000066":
            return { glyph: null, label: "occurs in", color: '#66CDAA' };
        case "RO:0002211":
            return { glyph: null, label: "regulates", color: '#2F4F4F' };
        case "RO:0002212":
            return { glyph: "tee", label: "negatively regulates", color: '#FF0000' };
        case "RO:0002630":
            return { glyph: "tee", label: "directly negatively regulates", color: '#FF0000' };
        case "RO:0002213":
            return { glyph: "triangle", label: "positively regulates", color: '#008000' };
        case "RO:0002629":
            return { glyph: "triangle", label: "directly positively regulates", color: '#008000' };
        case "RO:0002233":
            return { glyph: null, label: "has input", color: '#6495ED' };
        case "RO:0002234":
            return { glyph: null, label: "has output", color: '#ED6495' };
        case "RO:0002331":
            return { glyph: null, label: "involved in", color: '#E9967A' };
        case "RO:0002333":
            return { glyph: null, label: "enabled by", color: '#B8860B' };
        case "RO:0002411":
            return { glyph: null, label: "causally upstream of", color: '#483D8B' };
        case "RO:0002418":
            return { glyph: null, label: "causally upstream of or within", color: '#483D8B' };

        case "RO:0002408":
            return { glyph: "tee", label: "directly inhibits", color: '#FF0000' };
        case "RO:0002406":
            return { glyph: "triangle", label: "directly activates", color: '#008000' };

        case "RO:0002305":
            return { glyph: null, label: "causally upstream of, negative effect", color: '#FF0000' };
        case "RO:0004046":
            return { glyph: null, label: "causally upstream of or within, negative effect", color: '#FF0000' };

        case "RO:0002304":
            return { glyph: null, label: "causally upstream of, positive effect", color: '#008000' };
        case "RO:0004047":
            return { glyph: null, label: "causally upstream of or within, positive effect", color: '#008000' };

        case "annotation":
            return { glyph: "diamond", label: "annotation", color: '#483D8B' };
        case "instance_of":
            return { glyph: null, label: "activity", color: '#FFFAFA' };
    }
    console.log("No glyph found for relation '" + relation + "'");
    return { glyph: null, label: relation, color: "black" };
}



export function _node_ids_labels(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
        var accumulated_types = bin[cat_id];
        var cell_cache = [];
        for(let atype of accumulated_types) {
            var id = atype.class_id();
            var label = atype.class_label();
            cell_cache.push({ id : id, label : label });
        }
        retlist.push(cell_cache);
    };
    return retlist;
}

export function _node_labels(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
        var accumulated_types = bin[cat_id];
        var cell_cache = [];
        for(let atype of accumulated_types) {
            var tt = atype.class_label();
            cell_cache.push(tt);
        }
        retlist.push(cell_cache.join("\n"));
    };
    return retlist;
}

export function _node_ids(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
        var accumulated_types = bin[cat_id];
        var cell_cache = [];
        for(let atype of accumulated_types) {
            var tt = atype.class_id();
            cell_cache.push(tt);
        }
        retlist.push(cell_cache.join("\n"));
    };
    return retlist;
}
