import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'go-loading-spinner',
  styleUrl: 'loading-spinner.scss',
  shadow: true,
})
export class GoLoader {

  @Prop() message: string;

  render() {
    return (
      <div class="wrapper">
        <div class="ring"></div>
        {this.message}
      </div>
    );
  }

}
