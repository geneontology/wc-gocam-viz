import { Component, Prop, Element, Event, EventEmitter, Watch, h } from '@stencil/core';
import { State } from '@stencil/core';


@Component({
    tag: 'wc-gocam-selector',
    styleUrl: 'gocam-selector.css',
    shadow: false,
})
export class GoCamSelector {

    @Element() GoCamSelector;

    @Event({ bubbles: true, composed: true }) selectGOCAM: EventEmitter;
    
    url = "https://geneontology-public.s3.amazonaws.com/gocams.json";

    list = [
        "",
        "http://model.geneontology.org/568b0f9600000284",
        "http://model.geneontology.org/5e72450500003881",
        "http://model.geneontology.org/5c4605cc00003261",
        "http://model.geneontology.org/5b91dbd100001993",
        "http://model.geneontology.org/5b91dbd100001959",
        "http://model.geneontology.org/5df932e000000330",
        "http://model.geneontology.org/5b528b1100000489",
        "http://model.geneontology.org/5835403200000017",
        "http://model.geneontology.org/57ea2dae00000004",
        "http://model.geneontology.org/5b91dbd100002241",
        "http://model.geneontology.org/5b91dbd100002039",
        "http://model.geneontology.org/5b318d0900000583",
        "http://model.geneontology.org/5e72450500001046",
        "http://model.geneontology.org/5f46c3b700000011",
        "http://model.geneontology.org/5e72450500000869",
        "http://model.geneontology.org/5b91dbd100002057",
        "http://model.geneontology.org/5ce58dde00001215",
        "http://model.geneontology.org/57c82fad00000784",
        "http://model.geneontology.org/5ce58dde00001327",
        "http://model.geneontology.org/5716c41300000422",
        "http://model.geneontology.org/5e72450500000000",
        "http://model.geneontology.org/5df932e000002650",
        "http://model.geneontology.org/5d29221b00001995",
        "http://model.geneontology.org/5b318d0900000302",
        "http://model.geneontology.org/5df932e000003298",
        "http://model.geneontology.org/5d29221b00001945",
        "http://model.geneontology.org/5c4605cc00004193",
        "http://model.geneontology.org/5ae3b0f600001522",
        "http://model.geneontology.org/5d29221b00002847",
        "http://model.geneontology.org/5ed1aab700000290",
        "http://model.geneontology.org/5df932e000002440",
        "http://model.geneontology.org/5db9c9a500000632",
        "http://model.geneontology.org/57c82fad00000695",
        "http://model.geneontology.org/57c82fad00000403",
        "http://model.geneontology.org/5716c41300000389",
        "http://model.geneontology.org/5716c41300000277",
        "http://model.geneontology.org/5da4ff8500000105",
        "http://model.geneontology.org/5d29221b00002807",
        "http://model.geneontology.org/5d29221b00001607",
        "http://model.geneontology.org/580e952200000046",
        "http://model.geneontology.org/59bee34700000179",
        "http://model.geneontology.org/5f46c3b700003802"
    ]

    componentWillLoad() {
        // fetch(this.url)
        //     .then(data => data.json())
        //     .then(data => {
        //         console.log(data);
        //     })
    }

    select(evt) {
        let id = evt.target.value;
        this.selectGOCAM.emit({ id: id });
    }

    render() {
        return (
            <div class="gocam-selector">
                <span class='select__gocam__label'>Select GO-CAM: </span>
                <select id="gocam" onChange={(evt) => this.select(evt)} >
                    {
                        this.list.map(gocam => {
                            return <option value={gocam}>{gocam.split(".org/")[1]}</option>
                        })
                    }
                </select>
            </div>
        )
    }

}