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

/*  custom AudioNode: amplitude visualizer  */
export class AudioNodeAmplitude {
    declare public deactive: (deactive: boolean) => void
    declare public draw:     (canvas: HTMLCanvasElement) => void
    declare public undraw:   (canvas: HTMLCanvasElement) => void
    constructor (context: AudioContext, params: {
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
    } = {}) {
        /*  provide parameter defaults  */
        params.fftSize                ??= 512
        params.minDecibels            ??= -60
        params.maxDecibels            ??= 0
        params.smoothingTimeConstant  ??= 0.80
        params.intervalTime           ??= 1000 / 60
        params.intervalCount          ??= Math.round(300 / (1000 / 60)) /* for 300ms RMS/m */
        params.decibelBars            ??= [ -60, -45, -21, -6 ]
        params.colorBars              ??= [ "#306090", "#00b000", "#e0d000", "#e03030" ]
        params.colorBarsDeactive      ??= [ "#606060", "#808080", "#a0a0a0", "#c0c0c0" ]
        params.colorRMS               ??= "#ffffff"
        params.colorBackground        ??= "#000000"
        params.horizontal             ??= false

        /*  create meter  */
        const meter = new AudioNodeMeter(context, {
            fftSize:               params.fftSize,
            minDecibels:           params.minDecibels,
            maxDecibels:           params.maxDecibels,
            smoothingTimeConstant: params.smoothingTimeConstant,
            intervalTime:          params.intervalTime,
            intervalCount:         params.intervalCount
        })

        /*  internal state  */
        let canvases = [] as HTMLCanvasElement[]
        let timer: AnimationFrameTimer

        /*  allow caller to adjust our mute state  */
        let deactive = false;
        (meter as unknown as AudioNodeAmplitude).deactive = (_deactive) => { deactive = _deactive }

        /*  draw spectrum into canvas  */
        const _draw = (canvas: HTMLCanvasElement) => {
            /*  determine meter information  */
            const peak = meter.stat().peak
            const rms  = meter.stat().rmsM

            /*  prepare canvas  */
            const canvasCtx = canvas.getContext("2d")
            canvasCtx!.fillStyle = params.colorBackground!
            canvasCtx!.fillRect(0, 0, canvas.width, canvas.height)

            const colorBars = deactive ? params.colorBarsDeactive! : params.colorBars!
            const scaleToCanvasUnits = (value: number) => {
                if (params.horizontal)
                    return (value / (params.maxDecibels! - params.minDecibels!)) * canvas.width
                else
                    return (value / (params.maxDecibels! - params.minDecibels!)) * canvas.height
            }
            const drawSeg = (from: number, to: number, color: string) => {
                const b = scaleToCanvasUnits(Math.abs(to - params.minDecibels!))
                const h = scaleToCanvasUnits(Math.abs(to - from))
                canvasCtx!.fillStyle = color
                if (params.horizontal)
                    canvasCtx!.fillRect(b - h, 0, h, canvas.height)
                else
                    canvasCtx!.fillRect(0, canvas.height - b, canvas.width, h)
            }
            const len = Math.min(params.decibelBars!.length, colorBars.length)
            let from  = params.minDecibels!
            let color = colorBars[0]
            for (let i = 0; i < len; i++) {
                if (peak < params.decibelBars![i])
                    break
                else {
                    const to = params.decibelBars![i]
                    drawSeg(from, to, color)
                    color = colorBars[i]
                    from = to
                }
            }
            drawSeg(from, peak, color)

            const h = scaleToCanvasUnits(Math.abs(rms - params.minDecibels!))
            canvasCtx!.fillStyle = params.colorRMS!
            if (params.horizontal!)
                canvasCtx!.fillRect(h - 1, 0, 1, canvas.height)
            else
                canvasCtx!.fillRect(0, canvas.height - h, canvas.width, 1)
        }

        /*  add/remove canvas for spectrum visualization  */
        (meter as unknown as AudioNodeAmplitude).draw = function (canvas: HTMLCanvasElement) {
            canvases.push(canvas)
            if (canvases.length === 1) {
                timer = new AnimationFrameTimer(() => {
                    for (const canvas of canvases)
                        _draw(canvas)
                })
            }
        };
        (meter as unknown as AudioNodeAmplitude).undraw = function (canvas: HTMLCanvasElement) {
            canvases = canvases.filter((c) => c !== canvas)
            if (canvases.length === 0)
                timer.clear()
        }

        return (meter as unknown as AudioNodeAmplitude)
    }
}

