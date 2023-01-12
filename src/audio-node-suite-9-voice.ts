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
import {
    AudioNodeComposite
} from "./audio-node-suite-2-composite.js"
import {
    AudioNodeMute,
    AudioNodeGain,
    AudioNodeCompressor,
    AudioNodeLimiter
} from "./audio-node-suite-3-standard.js"
import {
    AudioNodeEqualizer
} from "./audio-node-suite-4-equalizer.js"
import {
    AudioNodeGate
} from "./audio-node-suite-6-gate.js"

/*  custom AudioNode: voice filter  */
export class AudioNodeVoice extends AudioNodeComposite {
    private _mute: AudioNodeMute
    private _gain: AudioNodeGain
    private _compensate = 0
    constructor (context: AudioContext, params: {
        equalizer?:  boolean,  /*  whether to enable equalizer  */
        noisegate?:  boolean,  /*  whether to enable noise gate (expander)  */
        compressor?: boolean,  /*  whether to enable compressor  */
        limiter?:    boolean,  /*  whether to enable limiter (hard compressor)  */
        gain?:       number    /*  additional decibel to change the gain after processing (default: 0)  */
    } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.equalizer   ??= true
        params.noisegate   ??= true
        params.compressor  ??= true
        params.limiter     ??= true
        params.gain        ??= 0

        /*  initialize aggregation input  */
        const nodes = [] as AudioNode[]

        /*  0. create: mute controller  */
        this._mute = new AudioNodeMute(context)
        nodes.push(this._mute)

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
        }

        /*  2. create: noise gate  */
        if (params.noisegate) {
            const gate = new AudioNodeGate(context)
            nodes.push(gate)
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
            this._compensate += -2.0
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
            this._compensate += -1.0
        }

        /*  5. create: gain control  */
        this._gain = new AudioNodeGain(context)
        nodes.push(this._gain)

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
            this._compensate += -1.0
        }

        /*  configure composite node chain  */
        for (let i = 0; i < nodes.length - 1; i++)
            nodes[i].connect(nodes[i + 1])
        this.chain(nodes[0], nodes[nodes.length - 1])

        /*  pre-set gain  */
        this.adjustGainDecibel(params.gain, 0)
    }

    /*  provide mute control  */
    mute (mute: boolean) {
        this._mute.mute(mute)
    }

    /*  provide gain adjustment  */
    adjustGainDecibel (db: number, ms = 10) {
        this._gain.adjustGainDecibel(this._compensate + db, ms)
    }
}

