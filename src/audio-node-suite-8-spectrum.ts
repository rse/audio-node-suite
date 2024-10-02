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
import { AnimationFrameTimer } from "./audio-node-suite-1-util.js"
import { AudioNodeMeter }      from "./audio-node-suite-5-meter.js"

/*  parameter pre-definition  */
type AudioNodeSpectrumParams = {
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

/*  custom AudioNode: spectrum visualizer  */
export class AudioNodeSpectrum extends AudioNodeMeter {
    private _canvases = [] as HTMLCanvasElement[]
    private _timer: AnimationFrameTimer | null = null
    private _params: AudioNodeSpectrumParams
    constructor (context: AudioContext, params: AudioNodeSpectrumParams = {}) {
        super(context, {
            fftSize:               (params.fftSize                ??= 8192),
            minDecibels:           (params.minDecibels            ??= -144),
            maxDecibels:           (params.maxDecibels            ??= 0),
            smoothingTimeConstant: (params.smoothingTimeConstant  ??= 0.80),
            intervalTime:          (params.intervalTime           ??= 1000 / 60),
            intervalCount:         0
        })

        /*  provide parameter defaults  */
        params.layers                 ??= [ -120, -90, -60, -50, -40, -30, -20, -10 ]
        params.slices                 ??= [ 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480 ]
        params.colorBackground        ??= "#000000"
        params.colorBars              ??= "#00cc00"
        params.colorLayers            ??= "#009900"
        params.colorSlices            ??= "#009900"
        params.logarithmic            ??= true

        this._params = params
    }

    /*  draw spectrum into canvas  */
    private _draw (canvas: HTMLCanvasElement) {
        /*  determine meter information  */
        const data = this.dataF()

        /*  prepare canvas  */
        const canvasCtx = canvas.getContext("2d")
        canvasCtx!.fillStyle = this._params.colorBackground!
        canvasCtx!.fillRect(0, 0, canvas.width, canvas.height)

        /*  helper function for scaling decibel to canvas units  */
        const scaleToCanvasUnits = (value: number) =>
            (value / (this._params.maxDecibels! - this._params.minDecibels!)) * canvas.height

        /*  draw horizontal decibel layers  */
        canvasCtx!.fillStyle = this._params.colorLayers!
        for (const layer of this._params.layers!) {
            const barHeight = scaleToCanvasUnits(Math.abs(layer - this._params.minDecibels!))
            canvasCtx!.fillRect(0, canvas.height - barHeight, canvas.width, 1)
        }

        /*  draw vertical frequency slices  */
        canvasCtx!.fillStyle = this._params.colorSlices!
        for (const slice of this._params.slices!) {
            /*  project from logarithmic frequency to canvas x-position */
            const x = Math.log2(slice / 20) * (canvas.width / 10)
            canvasCtx!.fillRect(x, 0, 1, canvas.height)
        }

        /*  draw the decibel per frequency bars  */
        canvasCtx!.fillStyle = this._params.colorBars!
        if (this._params.logarithmic!) {
            /*  iterate over all canvas x-positions  */
            for (let posX = 0; posX < canvas.width; posX++) {
                const barWidth = 1

                /*  project from canvas x-position to logarithmic frequency  */
                const f1 = 20 * Math.pow(2, posX       * 10 / canvas.width)
                const f2 = 20 * Math.pow(2, (posX + 1) * 10 / canvas.width)

                /*  project from logarithmic frequency to linear FFT decibel value  */
                const k1 = Math.round(f1 * (data.length / (20 * Math.pow(2, 10))))
                let k2 = Math.round(f2 * (data.length / (20 * Math.pow(2, 10)))) - 1
                if (k2 < k1)
                    k2 = k1

                /*  calculate the average decibel in case multiple FFT decibel values are in the range  */
                let db = 0
                for (let k = k1; k <= k2; k++)
                    db += data[k]
                db /= (k2 + 1) - k1

                /*  draw the bar  */
                const barHeight = scaleToCanvasUnits(db - this._params.minDecibels!)
                canvasCtx!.fillRect(posX, canvas.height - barHeight, barWidth, barHeight)
            }
        }
        else {
            let posX = 0
            const barWidth = (canvas.width / data.length)

            /*  iterate over all FFT decibel values  */
            for (let i = 0; i < data.length; i++) {
                const db = data[i]

                /*  draw the bar  */
                const barHeight = scaleToCanvasUnits(db - this._params.minDecibels!)
                canvasCtx!.fillRect(posX, canvas.height - barHeight, barWidth - 0.5, barHeight)

                posX += barWidth
            }
        }
    }

    /*  add/remove canvas for spectrum visualization  */
    draw (canvas: HTMLCanvasElement) {
        this._canvases.push(canvas)
        if (this._canvases.length === 1) {
            this._timer = new AnimationFrameTimer(() => {
                for (const canvas of this._canvases)
                    this._draw(canvas)
            })
        }
    }
    undraw (canvas: HTMLCanvasElement) {
        this._canvases = this._canvases.filter((c) => c !== canvas)
        if (this._canvases.length === 0)
            this._timer!.clear()
    }
}

