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

/*  internal signature of connect/disconnect methods  */
type connect    = (...args: any[]) => any
type disconnect = (...args: any[]) => any

/*  Composite Web Audio API AudioNode  */
export class AudioNodeComposite extends GainNode {
    /*  configured input/output nodes of composed chain  */
    public input:  AudioNode | null = null
    public output: AudioNode | null = null

    /*  internal state  */
    private _bypass  = false        /*  whether to bypass node  */
    private _targets = [] as any[]  /*  tracked connected targets  */

    /*  just pass-through construction  */
    constructor (context: AudioContext) {
        super(context)
    }

    /*  configure input/output chain  */
    chain (input: AudioNode, output: AudioNode = input) {
        /*  require at least a wrapped input node  */
        if (typeof input !== "object" || !(input instanceof AudioNode))
            throw new Error("input has to be a valid AudioNode")

        /*  configure chain  */
        this.input  = input
        this.output = output

        if (this._bypass) {
            /*  bypass mode: connect us to targets directly  */
            for (const _target of this._targets)
                (super.connect as connect)(..._target)
        }
        else {
            /*  regular mode: connect us to to targets via input/output nodes  */
            for (const _target of this._targets) {
                (super.disconnect as disconnect)(..._target);
                (this.output.connect as connect)(..._target)
            }
            if (this.input.numberOfInputs > 0)
                (super.connect as connect)(this.input)
        }
    }

    /*  provide an overloaded Web API "connect" method  */
    connect (...args: any[]): any {
        /*  track target  */
        this._targets.push(args)

        /*  connect us to target node  */
        let result: any
        if (this._bypass || this.output === null)
            result = (super.connect as connect)(...args)
        else
            result = (this.output.connect as connect)(...args)
        return result
    }

    /*  provide an overloaded Web API "disconnect" method  */
    disconnect (...args: any[]): any {
        /*  disconnect us from target node  */
        let result: any
        if (this._bypass || this.output === null)
            result = (super.disconnect as disconnect)(...args)
        else
            result = (this.output.disconnect as disconnect)(...args)

        /*  untrack target  */
        this._targets = this._targets.filter((_target: any[]) => {
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
    bypass (bypass: boolean) {
        /*  short-circuit no operations  */
        if (this._bypass === bypass)
            return

        /*  take over new state and dispatch according to it  */
        this._bypass = bypass
        if (this._bypass) {
            /*  bypass mode: connect us to targets directly  */
            if (this.input !== null && this.input.numberOfInputs > 0)
                (super.disconnect as disconnect)(this.input)
            for (const _target of this._targets) {
                if (this.output !== null)
                    (this.output.disconnect as disconnect)(..._target);
                (super.connect as connect)(..._target)
            }
        }
        else {
            /*  regular mode: connect us to to targets via input/output nodes  */
            for (const _target of this._targets) {
                (super.disconnect as disconnect)(..._target)
                if (this.output !== null)
                    (this.output.connect as connect)(..._target)
            }
            if (this.input !== null && this.input.numberOfInputs > 0)
                (super.connect as connect)(this.input)
        }
    }

    /*  provide convenient factory method  */
    static factory (context: AudioContext, nodes: AudioNode[]) {
        if (nodes.length < 1)
            throw new Error("at least one node has to be given")
        for (let i = 0; i < nodes.length - 1; i++)
            nodes[i].connect(nodes[i + 1])
        const composite = new AudioNodeComposite(context)
        composite.chain(nodes[0], nodes[nodes.length - 1])
        return composite
    }
}

