import { Component, Host, h } from '@stencil/core';
import { RELATION_MAP, STYLES } from '../../globals/relations';
import { LEGEND_COLUMNS } from '../../globals/legend';



@Component({
  tag: 'wc-gocam-legend',
  styleUrl: 'gocam-legend.scss',
  shadow: true,
})
export class GocamLegend {
  render() {
    return (
      <Host>
        <svg height="0" width="0" style={{ position: 'absolute' }}>
          <defs>
            {Object.entries(RELATION_MAP).map(([id, config]) => (
              config.glyph === 'circle-triangle' ?
                <marker id={`${config.glyph}-${id}`}
                  viewBox="0 0 20 10"
                  refX="18"
                  refY="5"
                  markerWidth="12"
                  markerHeight="4"
                  orient="auto">
                  <circle cx="7" cy="5" r="3.5" fill={config.color} />
                  <path d="M 12 0 L 18 5 L 12 10 z" fill={config.color} />
                </marker>
                :
                <marker id={`${config.glyph}-${id}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="4" markerHeight="4" orient="auto">
                  {config.glyph === 'triangle' && <path d="M 0 0 L 10 5 L 0 10 z" fill={config.color} />}
                  {config.glyph === 'tee' && <rect x="6" y="0" width="4" height="10" fill={config.color} />}
                  {config.glyph === 'circle' && <circle cx="5" cy="5" r="4" fill={config.color} />}
                  {config.glyph === 'square' && <rect x="0" y="0" width="10" height="10" fill={config.color} />}
                </marker>
            ))}
          </defs>
        </svg>

        <div class='header'>Relation Types</div>
        <div class='columns'>
          {Object.entries(LEGEND_COLUMNS).map(([columnName, ids]) => (
            <div class={`column ${columnName}`}>
              {ids.map(id => {
                const config = RELATION_MAP[id];
                return (
                  <div class='item'>
                    <svg height="30" width="60">
                      <line
                        x1="5" y1="15"
                        x2="45" y2="15"
                        stroke={config.color}
                        stroke-width={STYLES.SIZES.DEFAULT}
                        stroke-dasharray={config.lineStyle === 'dashed' ? '5,5' : 'none'}
                        marker-end={config.glyph ? `url(#${config.glyph}-${id})` : 'none'}
                      />
                    </svg>
                    <span>{config.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Host>
    );
  }
}