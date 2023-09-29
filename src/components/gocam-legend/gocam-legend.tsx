import { Component, Host, h, getAssetPath } from '@stencil/core';
import { legend } from '../../globals/constants';

/**
 * @part header - The header
 * @part section - Group of legend entries
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
        <div class='header' part="header">Relation Types</div>
        <div class='sections'>
          {Object.keys(legend).map((section) => {
            return (
              <div class={'section ' + section} part="section">
                {legend[section].map((item) => {
                  return (
                    <div class='item'>
                      <img alt={item.label}
                           src={getAssetPath(`./assets/relation/${item.id}.png`)}></img>
                      <div class='item-label'>
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Host>
    );
  }
}
