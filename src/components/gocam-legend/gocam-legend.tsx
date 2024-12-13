import { Component, Fragment, Host, h } from '@stencil/core';
import { RELATION_MAP, STYLES } from '../../globals/relations';
import { LEGEND_COLUMNS } from '../../globals/legend';


/**
 * @part header - The header
 * @part sections - Group of legend entries
 * @part section - An individual legend entry
 */
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
              <marker id={`${config.glyph}-${id}`}
                viewBox="-2 0 18 10"
                refX="18"
                refY="5"
                markerWidth="12"
                markerHeight="4"
                orient="auto">
                {config.glyph === 'circle-triangle' && (
                  <Fragment>
                    <path d="M 4 0 L 12 5 L 4 10 z" fill={config.color} />
                    <circle cx="16" cy="5" r="5" fill={config.color} />
                  </Fragment>
                )}
                {config.glyph === 'triangle' && <path d="M 12 0 L 20 5 L 12 10 z" fill={config.color} />}
                {config.glyph === 'tee' && <rect x="14" y="0" width="4" height="10" fill={config.color} />}
                {config.glyph === 'circle' && <circle cx="16" cy="5" r="5" fill={config.color} />}
                {config.glyph === 'square' && <rect x="12" y="0" width="8" height="10" fill={config.color} />}
              </marker>
            ))}
          </defs>
        </svg>

        <div class='header' part="header">Relation Types</div>
        <div class="sections" part="sections">
          {Object.entries(LEGEND_COLUMNS).map(([columnName, relations]) => (
            <div class={`section ${columnName}`} part="section">
              {Object.entries(relations).map(([relationId, label]) => {
                const config = RELATION_MAP[relationId];
                return (
                  <div class="item">
                    <svg height="30" width="60">
                      <line
                        x1="5" y1="15"
                        x2="45" y2="15"
                        stroke={config.color}
                        stroke-width={STYLES.SIZES.DEFAULT}
                        stroke-dasharray={config.lineStyle === 'dashed' ? '5,5' : 'none'}
                        marker-end={config.glyph ? `url(#${config.glyph}-${relationId})` : 'none'}
                      />
                    </svg>
                    <span>{label}</span>
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