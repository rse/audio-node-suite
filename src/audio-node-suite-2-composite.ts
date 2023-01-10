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

/*  Composite Web Audio API AudioNode  */
export class AudioNodeComposite extends GainNode {
    private _bypass      = false
    private _connect:    any
    private _disconnect: any
    private _targets     = [] as any[]
    declare public context: BaseAudioContext
    declare public input:   AudioNode
    declare public output:  AudioNode
    declare public bypass:  (bypass: boolean) => void
    constructor (input: AudioNode, output: AudioNode = input) {
        super(input.context)

        /*  require at least a wrapped input node  */
        if (typeof input !== "object" || !(input instanceof AudioNode))
            throw new Error("input has to be a valid AudioNode")

        /*  determine AudioContext via input node  */
        const context = input.context

        /*  use a no-op AudioNode node to represent us  */
        let node: AudioNodeComposite
        if (input.numberOfInputs > 0) {
            node = context.createGain() as unknown as AudioNodeComposite
            node.connect(input)
        }
        else {
            const bs = context.createBufferSource()
            bs.buffer = null
            node = bs as unknown as AudioNodeComposite
        }

        /*  track the connected targets and bypass state  */
        node._targets = [] as AudioNode[]
        node._bypass  = false

        /*  provide an overloaded Web API "connect" method  */
        node._connect = node.connect
        const connect = (...args: any[]): any => {
            /*  track target  */
            node._targets.push(args)

            /*  connect us to target node  */
            let result: any
            if (node._bypass) {
                if (input.numberOfInputs > 0)
                    result = node._connect(...args)
                else
                    result = (input.connect as (...args: any[]) => any)(...args)
            }
            else
                result = (output.connect as (...args: any[]) => any)(...args)

            return result
        }
        node.connect = connect

        /*  provide an overloaded Web API "disconnect" method  */
        node._disconnect = node.disconnect
        node.disconnect = (...args: any[]): any => {
            /*  disconnect us from target node  */
            let result: any
            if (node._bypass) {
                if (input.numberOfInputs > 0)
                    result = node._disconnect(...args)
                else
                    result = (input.connect as (...args: any[]) => any)(...args)
            }
            else
                result = (output.disconnect as (...args: any[]) => any)(...args)

            /*  untrack target  */
            node._targets = node._targets.filter((_target: any[]) => {
                if (_target.length !== args.length)
                    return true
                for (let i = 0; i < args.length; i++)
                    if (_target[i] !== args[i])
                        return true
                return false
            })

            return result
        }

        /*  provide a custom "bypass" method  */
        node.bypass = (bypass: boolean) => {
            /*  short-circuit no operations  */
            if (node._bypass === bypass)
                return

            /*  take over new state and dispatch according to it  */
            node._bypass = bypass
            if (node._bypass) {
                /*  bypass mode: connect us to targets directly  */
                if (input.numberOfInputs > 0)
                    node._disconnect(input)
                for (const _target of node._targets) {
                    (output.disconnect as (...args: any[]) => any)(..._target)
                    node._connect(..._target)
                }
            }
            else {
                /*  regular mode: connect us to to targets via input/output nodes  */
                for (const _target of node._targets) {
                    node._disconnect.apply(null, _target);
                    (output.connect as (...args: any[]) => any)(..._target)
                }
                if (input.numberOfInputs > 0)
                    node._connect(input)
            }
        }

        /*  pass-through input and output nodes  */
        node.input  = input
        node.output = output

        /*  return our "AudioNode" representation (instead of ourself)  */
        return node
    }

    /*  factory for Composite Web Audio API AudioNode  */
    static factory (nodes: AudioNode[]) {
        if (nodes.length < 1)
            throw new Error("at least one node has to be given")
        for (let i = 0; i < nodes.length - 1; i++)
            nodes[i].connect(nodes[i + 1])
        return new AudioNodeComposite(nodes[0], nodes[nodes.length - 1])
    }
}

