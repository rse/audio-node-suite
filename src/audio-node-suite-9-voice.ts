/*
**  Audio-Node-Suite -- Web Audio API AudioNode Suite
**  Copyright (c) 2020-2023 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
import { AudioNodeComposite }                                   from "./audio-node-suite-2-composite.js"
import { AudioNodeGain, AudioNodeCompressor, AudioNodeLimiter } from "./audio-node-suite-3-standard.js"
import { AudioNodeEqualizer }                                   from "./audio-node-suite-4-equalizer.js"
import { AudioNodeGate }                                        from "./audio-node-suite-6-gate.js"

/*  custom AudioNode: voice filter  */
export class AudioNodeVoice {
    declare public adjustGainDecibel: (db: number, ms?: number) => void
    constructor (context: AudioContext, params: {
        equalizer?:  boolean,  /*  whether to enable equalizer  */
        noisegate?:  boolean,  /*  whether to enable noise gate (expander)  */
        compressor?: boolean,  /*  whether to enable compressor  */
        limiter?:    boolean,  /*  whether to enable limiter (hard compressor)  */
        gain?:       number    /*  additional decibel to change the gain after processing (default: 0)  */
    } = {}) {
        /*  provide parameter defaults  */
        params.equalizer   ??= true
        params.noisegate   ??= true
        params.compressor  ??= true
        params.limiter     ??= true
        params.gain        ??= 0

        /*  initialize aggregation input  */
        const nodes = [] as any[]
        let compensate = 0

        /*  1. create: cutting equalizer  */
        if (params.equalizer) {
            const cutEQ = new AudioNodeEqualizer(context, {
                bands: [
                    { type: "highpass",  freq:    80, q:  0.25 },
                    { type: "highpass",  freq:    80, q:  0.50 },
                    { type: "notch",     freq:    50, q:  0.25 },
                    { type: "notch",     freq:   960, q:  4.00 },
                    { type: "lowpass",   freq: 20480, q:  0.50 },
                    { type: "lowpass",   freq: 20480, q:  0.25 }
                ]
            })
            nodes.push(cutEQ)
            /* compensate += 0 */
        }

        /*  2. create: noise gate  */
        if (params.noisegate) {
            const gate = new AudioNodeGate(context)
            nodes.push(gate)
            /* compensate += 0 */
        }

        /*  3. create: compressor  */
        if (params.compressor) {
            const comp = new AudioNodeCompressor(context, {
                threshold: -16.0,
                attack:    0.003,
                release:   0.400,
                knee:      3.0,
                ratio:     2
            })
            nodes.push(comp)
            compensate += -2.0
        }

        /*  4. create: boosting equalizer  */
        if (params.equalizer) {
            const boostEQ = new AudioNodeEqualizer(context, {
                bands: [
                    { type: "peaking",   freq:   240, q:  0.75, gain: 3.00 },
                    { type: "highshelf", freq:  3840, q:  0.75, gain: 6.00 }
                ]
            })
            nodes.push(boostEQ)
            compensate += -1.0
        }

        /*  5. create: gain control  */
        const gain = new AudioNodeGain(context)
        nodes.push(gain)

        /*  6. create: limiter  */
        if (params.limiter) {
            const limiter = new AudioNodeLimiter(context, {
                threshold: -3.0,
                attack:    0.001,
                release:   0.050,
                knee:      0,
                ratio:     20
            })
            nodes.push(limiter)
            compensate += -1.0
        }

        /*  create composite node  */
        const composite = AudioNodeComposite.factory(nodes as AudioNode[]) as unknown as AudioNodeVoice

        /*  provide gain adjustment  */
        composite.adjustGainDecibel = (db, ms = 10) =>
            gain.adjustGainDecibel(compensate + db, ms)
        composite.adjustGainDecibel(compensate + params.gain, 0)

        /*  create return a composite node  */
        return composite
    }
}

