/*!
**  Audio-Node-Suite -- Web Audio API AudioNode Suite
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

declare module "AudioNodeSuite" {
    /*  Composite `AudioNode` subclass by wrapping the node chain
        from an input node to an output node (if not given, it is the same as the input node).
        The `AudioContext` for the node is taken over from the input node.

        As an `AudioNode` is an `EventEmitter`, this composite
        node emits the following `CustomEvent` instances
        for the calls `result = node.[dis]connect(target)`:
        `CustomEvent("[dis]connect-before", { detail: { target }
        })` and `CustomEvent("[dis]connect-after", { detail: {
        result, target } })`. Similar, for the `node.bypass(enable)`
        calls, it emits: `CustomEvent("bypass-enable-before")`,
        `CustomEvent("bypass-enable-after")`, `CustomEvent("bypass-disable-before")`,
        or `CustomEvent("bypass-disable-after")`.  */
    export class AudioNodeComposite extends AudioNode {
        public constructor(
            input:   AudioNode,      /*  input  node to wrap  */
            output?: AudioNode       /*  output node to wrap  */
        )
        bypass(
            enable: boolean          /*  whether to bypass the effects of the node chain  */
        ): void
    }

    /*  standard `AudioNode` for convenient Gain control.  */
    export class AudioNodeGain extends AudioNode {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                db: number           /*  decibel to change the gain (default: 0)  */
            }
        )
    }

    /*  standard `AudioNode` for convenient Compressor effect.  */
    export class AudioNodeCompressor extends AudioNode {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                threshold: number,   /*  threshold in decibel to compress above (default: -16.0),  */
                attack:    number,   /*  time in seconds to attack/clamp-up volume (default: 0.003)  */
                release:   number,   /*  time in seconds to release/clamp-down volume (default: 0.400)  */
                knee:      number,   /*  smoothing "knee" in decibels at threshold (default: 3.0)  */
                ratio:     number    /*  ratio for decibels to compress above threshold (default: 2.0)  */
            }
        )
    }

    /*  standard `AudioNode` for convenient Limiter effect.
        (effectively, a maximum Compressor near the clipping zone)  */
    export class AudioNodeLimiter extends AudioNode {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                threshold: number,   /*  threshold in decibel to compress above (default: -3.0),  */
                attack:    number,   /*  time in seconds to attack/clamp-up volume (default: 0.003)  */
                release:   number,   /*  time in seconds to release/clamp-down volume (default: 0.050)  */
                knee:      number,   /*  smoothing "knee" in decibels at threshold (default: 0.0)  */
                ratio:     number    /*  ratio for decibels to compress above threshold (default: 20.0)  */
            }
        )
    }

    /*  standard `AudioNode` for multi-band parameteric equalizer.  */
    export class AudioNodeEqualizer extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                bands: {
                    type:  string,   /*  type of Biquad filter (default: "peaking"),  */
                    freq:  number,   /*  base frequency to act on (default: 64*2^i)  */
                    q:     number,   /*  Q factor to apply (default: 1.0)  */
                    gain?: number    /*  gain to apply (default: 1.0)  */
                }[]
            }
        )
    }

    /*  standard `AudioNode` for meter, measuring the volume.  */
    export class AudioNodeMeter extends AudioNode {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                fftSize:               number, /*  FFT size (default: 2048)  */
                minDecibels:           number, /*  FFT minimum decibels (default: -100)  */
                maxDecibels:           number, /*  FFT maximum decibels (default: 0)  */
                smoothingTimeConstant: number, /*  FFT smoothing time constant (default: 0.8)  */
                intervalTime:          number, /*  interval time in milliseconds to act (default: 1000 / 120)  */
                intervalLength:        number  /*  interval length for average calculations (default: 100)  */
            }
        )
    }

    /*  standard `AudioNode` for noise gate.  */
    export class AudioNodeMeter extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                threshold:  number,  /* open above threshold (dbFS) (default: -50)  */
                hysteresis: number,  /* close below threshold+hysteresis (dbFS) (default: -6)  */
                reduction:  number,  /* reduction of volume gain (dbFS) (default: -50)  */
                interval:   number,  /* tracking interval (ms) (default: 2)  */
                attack:     number,  /* time to attack/clamp-up volume (ms) (default: 4) */
                hold:       number,  /* time to hold volume after it dropped below threshold+hysteresis (ms) (default: 40)  */
                release:    number   /* time to release/clamp-down volume (ms) (default: 20)  */
            }
        )
    }

    /*  standard `AudioNode` for spectrum visualization.  */
    export class AudioNodeSpectrum extends AudioNode {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                fftSize:               number,   /*  FFT size (default: 2048)  */
                minDecibels:           number,   /*  FFT minimum decibels (default: -100)  */
                maxDecibels:           number,   /*  FFT maximum decibels (default: 0)  */
                smoothingTimeConstant: number,   /*  FFT smoothing time constant (default: 0.8)  */
                intervalTime:          number,   /*  interval time in milliseconds to act (default: 1000 / 60)  */
                intervalLength:        number    /*  interval length for average calculations (default: 10)  */
                layers:                number[], /*  list of decibel layers to draw (default: [ -120, -90, -60, -30 ])  */
                slices:                number[], /*  list of frequency slices to draw (default: [ 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480 ])  */
                colorBackground:       string,   /*  color of the background (default: "#000000")  */
                colorBars:             string,   /*  color of the spectrum bars (default: "#00cc00")  */
                colorAvg:              string,   /*  color of the average maximum decibel (default: "#00ff00")  */
                colorLayers:           string,   /*  color of the decibel layer lines (default: "#009900")  */
                colorSlices:           string,   /*  color of the frequency slice lines (default: "#009900")  */
                logarithmic:           boolean   /*  whether to use logarithmic scale for frequencies (default: true)  */
            }
        )
    }

    /*  standard `AudioNode` for opinionated voice filtering.  */
    export class AudioNodeVoice extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
            }
        )
    }
}

