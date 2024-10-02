/*
**  Audio-Node-Suite -- Web Audio API AudioNode Suite
**  Copyright (c) 2020-2024 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  internal requirements  */
import { AudioNodeComposite } from "./audio-node-suite-2-composite.js"

/*  custom AudioNode: parametric equalizer  */
export class AudioNodeEqualizer extends AudioNodeComposite {
    /* global BiquadFilterType */
    constructor (context: AudioContext, params: { bands?:
        Array<{ type?: BiquadFilterType, freq?: number, q?: number, gain?: number }> } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.bands ??= []

        /*  interate over all bands  */
        const bands = []
        if (params.bands.length < 1)
            throw new Error("at least one band has to be specified")
        for (let i = 0; i < params.bands.length; i++) {
            /*  determine band parameters  */
            const options = {
                type: "peaking" as BiquadFilterType,
                freq: 64 * Math.pow(2, i),
                q:    1.0,
                gain: 1.0,
                ...params.bands[i]
            }

            /*  create and configure underlying Biquad node for band  */
            const band = context.createBiquadFilter()
            band.type = options.type
            band.frequency.setValueAtTime(options.freq, context.currentTime)
            band.Q.setValueAtTime(options.q, context.currentTime)
            band.gain.setValueAtTime(options.gain, context.currentTime)

            /*  assemble bands  */
            bands.push(band)
            if (i > 0)
                bands[i - 1].connect(bands[i])
        }

        /*  create result node  */
        if (params.bands.length === 1)
            this.chain(bands[0])
        else
            this.chain(bands[0], bands[bands.length - 1])
    }
}

