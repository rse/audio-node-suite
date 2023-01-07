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
import { AnimationFrameTimer } from "./audio-node-suite-1-util.js"
import { AudioNodeMeter }      from "./audio-node-suite-5-meter.js"

/*  custom AudioNode: spectrum visualizer  */
export class AudioNodeSpectrum {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            fftSize:               8192,
            minDecibels:           -144,
            maxDecibels:           0,
            smoothingTimeConstant: 0.80,
            intervalTime:          1000 / 60,
            layers:                [ -144, -120, -90, -60, -50, -40, -30, -20, -10, 0 ],
            slices:                [ 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480 ],
            colorBackground:       "#000000",
            colorBars:             "#00cc00",
            colorAvg:              "#00ff00",
            colorLayers:           "#009900",
            colorSlices:           "#009900",
            logarithmic:           true
        }, params)

        /*  create meter  */
        const meter = new AudioNodeMeter(context, {
            fftSize:               params.fftSize,
            minDecibels:           params.minDecibels,
            maxDecibels:           params.maxDecibels,
            smoothingTimeConstant: params.smoothingTimeConstant,
            intervalTime:          params.intervalTime,
            intervalCount:         0
        })

        /*  internal state  */
        let canvases = []
        let timer = null

        /*  add/remove canvas for spectrum visualization  */
        meter.draw = function (canvas) {
            canvases.push(canvas)
            if (canvases.length === 1) {
                timer = new AnimationFrameTimer(() => {
                    for (const canvas of canvases)
                        meter._draw(canvas)
                })
            }
        }
        meter.undraw = function (canvas) {
            canvases = canvases.filter((c) => c !== canvas)
            if (canvases.length === 0)
                timer.clear()
        }

        /*  draw spectrum into canvas  */
        meter._draw = function (canvas) {
            /*  determine meter information  */
            const data  = meter.dataF()

            /*  prepare canvas  */
            const canvasCtx = canvas.getContext("2d")
            canvasCtx.fillStyle = params.colorBackground
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            /*  draw horizontal decibel layers  */
            canvasCtx.fillStyle = params.colorLayers
            for (const layer of params.layers) {
                const barHeight = (Math.abs(layer - meter.minDecibels) / (meter.maxDecibels - meter.minDecibels)) * canvas.height
                canvasCtx.fillRect(0, canvas.height - barHeight, canvas.width, 1)
            }

            /*  draw vertical frequency slices  */
            canvasCtx.fillStyle = params.colorSlices
            for (const slice of params.slices) {
                /*  project from logarithmic frequency to canvas x-position */
                const x = Math.log2(slice / 20) * (canvas.width / 10)
                canvasCtx.fillRect(x, 0, 1, canvas.height)
            }

            /*  draw the decibel per frequency bars  */
            canvasCtx.fillStyle = params.colorBars
            if (params.logarithmic) {
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
                    const barHeight = (Math.abs(db - meter.minDecibels) / (meter.maxDecibels - meter.minDecibels)) * canvas.height
                    canvasCtx.fillRect(posX, canvas.height - barHeight, barWidth, barHeight)
                }
            }
            else {
                let posX = 0
                const barWidth = (canvas.width / data.length)

                /*  iterate over all FFT decibel values  */
                for (let i = 0; i < data.length; i++) {
                    const db = data[i]

                    /*  draw the bar  */
                    const barHeight = (Math.abs(db - meter.minDecibels) / (meter.maxDecibels - meter.minDecibels)) * canvas.height
                    canvasCtx.fillRect(posX, canvas.height - barHeight, barWidth - 0.5, barHeight)

                    posX += barWidth
                }
            }
        }
        return meter
    }
}

