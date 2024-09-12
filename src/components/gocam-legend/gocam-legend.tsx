import { Component, Host, h } from '@stencil/core';
import { legend } from '../../globals/constants';

import direct_regulation from './assets/relation/direct_regulation.png';
import indirect_regulation from './assets/relation/indirect_regulation.png';
import positive_regulation from './assets/relation/positive_regulation.png';
import negative_regulation from './assets/relation/negative_regulation.png';
import provides_input_for from './assets/relation/provides_input_for.png';
import neutral from './assets/relation/neutral.png';
import has_input from './assets/relation/has_input.png';
import has_output from './assets/relation/has_output.png';

// Stencil's Assets feature[1] makes client applications jump through a lot of hoops[2] in order
// to get the assets served from the right location if they choose to the NPM package instead of
// a <script> tag. Since these legend images are quite small, it's a good tradeoff to just inline
// them via the rollup image plugin[3].
// [1] https://stenciljs.com/docs/assets
// [2] https://github.com/ionic-team/stencil/issues/1868
// [3] https://github.com/rollup/plugins/tree/master/packages/image

const IMAGE_DATA = {
  direct_regulation,
  indirect_regulation,
  positive_regulation,
  negative_regulation,
  provides_input_for,
  neutral,
  has_input,
  has_output
};

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
                      <img alt={item.label} src={IMAGE_DATA[item.id]}></img>
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
