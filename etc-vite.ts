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

import * as Vite from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default Vite.defineConfig(({ command, mode }) => ({
    base: "",
    appType: "custom",
    plugins: [
        viteStaticCopy({
            structured: false,
            targets: [ {
                src:    "src/audio-node-suite.d.ts",
                dest:   "",
                rename: (fn, ext, p) => "audio-node-suite.d.mts"
            } ]
        })
    ],
    build: {
        outDir: "lib",
        minify: false,
        target: "es2022",
        sourcemap: (mode === "development"),
        lib: {
            name:  "AudioNodeSuite",
            entry: "src/audio-node-suite.ts",
            formats: [ "es", "cjs", "umd" ],
            fileName: (format) => {
                if      (format === "es")  return `audio-node-suite.es.mjs`
                else if (format === "cjs") return `audio-node-suite.cjs.js`
                else if (format === "umd") return `audio-node-suite.umd.js`
            }
        }
    }
}))

