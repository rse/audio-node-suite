/*!
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

declare module "AudioNodeSuite" {
    /*  Composite `AudioNode` subclass by wrapping the node chain from an
        input node to an output node (if not given, it is the same as the
        input node). The `AudioContext` for the node is taken over from the
        input node.  */
    export class AudioNodeComposite extends AudioNode {
        public constructor(
            input:   AudioNode,      /*  input  node to wrap  */
            output?: AudioNode       /*  output node to wrap  */
        )
        bypass(
            enable: boolean          /*  whether to bypass the effects of the node chain  */
        ): void
        get input():  AudioNode      /*  getter for underlying input  node  */
        get output(): AudioNode      /*  getter for underlying output node  */
        static factory (
            nodes: Array<AudioNode>  /*  (still unlinked) list of nodes to chain sequentially  */
        ): AudioNodeComposite
    }

    /*  `AudioNode` for convenient silence generation.  */
    export class AudioNodeSilence extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                channels?: number    /*  number of audio channels (default: 1)  */
            }
        )
    }

    /*  `AudioNode` for convenient noise generation.
        White noise is random amplitudes across the entire frequency range, and
        pink noise is random amplitudes across the entire frequency range and
        where the amplitudes of the higher frequences are less strong than the low frequences.  */
    export class AudioNodeNoise extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                type?:     string,   /*  type of noise ("white" or "pink") (default: "pink"),  */
                channels?: number    /*  number of audio channels (default: 1)  */
            }
        )
    }

    /*  `AudioNode` for convenient Mute control  */
    export class AudioNodeMute extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                mute?: boolean       /*  whether to mute initially (default: false)  */
            }
        )
        mute(
            mute: boolean,           /* whether to mute or unmute  */
            ms?: number              /* linear adjust time in milliseconds (default: 10)  */
        ): void
        muted(
        ): boolean
    }

    /*  `AudioNode` for convenient Gain control
        which acts on decibels instead of ampliture gain.  */
    export class AudioNodeGain extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                gain?: number        /*  decibel to change the gain (default: 0)  */
            }
        )
        adjustGainDecibel(
            db:  number,             /* target decibel  */
            ms?: number              /* linear adjust time in milliseconds (default: 10)  */
        ): void
    }

    /*  `AudioNode` for convenient Compressor effect.  */
    export class AudioNodeCompressor extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                threshold?: number,  /*  threshold in decibel to compress above (default: -16.0),  */
                attack?:    number,  /*  time in seconds to attack/clamp-up volume (default: 0.003)  */
                release?:   number,  /*  time in seconds to release/clamp-down volume (default: 0.400)  */
                knee?:      number,  /*  smoothing "knee" in decibels at threshold (default: 3.0)  */
                ratio?:     number   /*  ratio for decibels to compress above threshold (default: 2)  */
            }
        )
    }

    /*  `AudioNode` for convenient Limiter effect.
        (effectively, a maximum Compressor near the clipping zone)  */
    export class AudioNodeLimiter extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                threshold?: number,  /*  threshold in decibel to compress above (default: -3.0),  */
                attack?:    number,  /*  time in seconds to attack/clamp-up volume (default: 0.001)  */
                release?:   number,  /*  time in seconds to release/clamp-down volume (default: 0.050)  */
                knee?:      number,  /*  smoothing "knee" in decibels at threshold (default: 0.0)  */
                ratio?:     number   /*  ratio for decibels to compress above threshold (default: 20)  */
            }
        )
    }

    /*  `AudioNode` for parametric multi-band equalizer.  */
    export class AudioNodeEqualizer extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                bands?: Array<{
                    type?: string,   /*  type of Biquad filter (default: "peaking"),  */
                    freq?: number,   /*  base frequency to act on (default: 64*2^i)  */
                    q?:    number,   /*  Q factor to apply (default: 1.0)  */
                    gain?: number    /*  gain to apply (default: 1.0)  */
                }>
            }
        )
    }

    /*  `AudioNode` for meter, measuring the amplitude.  */
    export class AudioNodeMeter extends AudioNodeComposite {
        public constructor(
            context: AudioContext,              /*  context to associate  */
            params?: {
                fftSize?:               number, /*  FFT size (default: 512)  */
                minDecibels?:           number, /*  FFT minimum decibels (default: -94)  */
                maxDecibels?:           number, /*  FFT maximum decibels (default: 0)  */
                smoothingTimeConstant?: number, /*  FFT smoothing time constant (default: 0.8)  */
                intervalTime?:          number, /*  interval time in milliseconds to act (default: 3)  */
                intervalCount?:         number  /*  interval count for average calculations (default: 100)  */
            }
        )
    }

    /*  `AudioNode` for noise gate.  */
    export class AudioNodeGate extends AudioNodeComposite {
        public constructor(
            context: AudioContext,    /*  context to associate  */
            params?: {
                threshold?:  number,  /*  open above threshold (dbFS) (default: -45)  */
                hysteresis?: number,  /*  close below threshold+hysteresis (dbFS) (default: -3)  */
                reduction?:  number,  /*  reduction of volume gain (dbFS) (default: -30)  */
                interval?:   number,  /*  tracking interval (ms) (default: 2)  */
                attack?:     number,  /*  time to attack/clamp-up volume (ms) (default: 4) */
                hold?:       number,  /*  time to hold volume after it dropped below threshold+hysteresis (ms) (default: 40)  */
                release?:    number   /*  time to release/clamp-down volume (ms) (default: 200)  */
            }
        )
    }

    /*  `AudioNode` for amplitude visualization.  */
    export class AudioNodeAmplitude extends AudioNodeComposite {
        public constructor(
            context: AudioContext,               /*  context to associate  */
            params?: {
                fftSize?:               number,   /*  FFT size (default: 512)  */
                minDecibels?:           number,   /*  FFT minimum decibels (default: -60)  */
                maxDecibels?:           number,   /*  FFT maximum decibels (default: 0)  */
                smoothingTimeConstant?: number,   /*  FFT smoothing time constant (default: 0.8)  */
                intervalTime?:          number,   /*  interval time in milliseconds to act (default: 1000 / 60)  */
                intervalCount?:         number    /*  interval length for average calculations (default: 300 / (1000 / 60))  */
                decibelBars?:           number[], /*  list of decibel layers to draw (default: [ -60, -45, -21, -6 ])  */
                colorBars?:             string[], /*  list of color   layers to draw (default: [ "#306090", "#00b000", "#e0d000", "#e03030" ])  */
                colorBarsDeactive?:     string[], /*  list of color   layers to draw (default: [ "#606060", "#808080", "#a0a0a0", "#c0c0c0" ])  */
                colorRMS?:              string,   /*  color of the RMS decibel (default: "#ffffff")  */
                colorBackground?:       string,   /*  color of the background (default: "#000000")  */
                horizontal?:            boolean   /*  whether to draw horizontall instead of vertically (default: false)  */
            }
        )
    }

    /*  `AudioNode` for spectrum visualization ("spectrogram" style).  */
    export class AudioNodeSpectrum extends AudioNodeComposite {
        public constructor(
            context: AudioContext,   /*  context to associate  */
            params?: {
                fftSize?:               number,   /*  FFT size (default: 8192)  */
                minDecibels?:           number,   /*  FFT minimum decibels (default: -144)  */
                maxDecibels?:           number,   /*  FFT maximum decibels (default: 0)  */
                smoothingTimeConstant?: number,   /*  FFT smoothing time constant (default: 0.8)  */
                intervalTime?:          number,   /*  interval time in milliseconds to act (default: 1000 / 60)  */
                layers?:                number[], /*  list of decibel layers to draw (default: [ -120, -90, -60, -50, -40, -30, -20, -10 ])  */
                slices?:                number[], /*  list of frequency slices to draw (default: [ 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480 ])  */
                colorBackground?:       string,   /*  color of the background (default: "#000000")  */
                colorBars?:             string,   /*  color of the spectrum bars (default: "#00cc00")  */
                colorLayers?:           string,   /*  color of the decibel layer lines (default: "#009900")  */
                colorSlices?:           string,   /*  color of the frequency slice lines (default: "#009900")  */
                logarithmic?:           boolean   /*  whether to use logarithmic scale for frequencies (default: true)  */
            }
        )
    }

    /*  `AudioNode` for opinionated voice filtering.  */
    export class AudioNodeVoice extends AudioNodeComposite {
        public constructor(
            context: AudioContext,     /*  context to associate  */
            params?: {
                equalizer?:  boolean,  /*  whether to enable equalizer  */
                noisegate?:  boolean,  /*  whether to enable noise gate (expander)  */
                compressor?: boolean,  /*  whether to enable compressor  */
                limiter?:    boolean,  /*  whether to enable limiter (hard compressor)  */
                gain?:       number    /*  additional decibel to change the gain after processing (default: 0)  */
            }
        )
        adjustGainDecibel(
            db:  number,             /* target decibel  */
            ms?: number              /* linear adjust time in milliseconds  */
        ): void
    }
}

