import ansiColors from 'ansi-colors';
import input from './input';

// FF - FlipFlop
// C - Conjunction
type ModuleType = 'FF' | 'C' | 'BR'
type Pulse = 'H' | 'L' // high or low

// high pulse - nothing happens
// low pulse - flip state
//   - on => high pulse sent
//   - off => low pulse sent
type FlipFlopModule = {
    name: string,
    type: 'FF',
    state: 'off' | 'on' // FF - initially off
    targets: string[]
}

type BroadcasterModule = {
    name: string,
    type: 'BR',
    targets: string[]
}
type ConjunctionModule = {
    name: string,
    type: 'C',
    inputs: {
        [source in string]: Pulse
    },
    targets: string[]
}

type Module = FlipFlopModule | ConjunctionModule | BroadcasterModule | {
    name: string,
    type: 'DUMMY',
    lowPulses: number,
    highPulses: number
}

type World = {
    modules: {
        [name in string]: Module
    },
    highPulses: number,
    lowPulses: number
}

type PulseSent = {
    origin: string,
    target: string,
    pulse: Pulse
}

function pressButton(world: World): World {
    world.lowPulses += 1
    let pulsesToProcess: PulseSent[] = [{
        origin: 'button',
        target: 'broadcaster',
        pulse: 'L'
    }];

    while (pulsesToProcess.length > 0) {
        const pulseSent = pulsesToProcess.shift()!
        const module = world.modules[pulseSent.target]

        if (!module) {
            throw new Error(`There's no module named ${pulseSent.target}`)
        }

        switch (module.type) {
            case 'BR': {
                // just send to all its targets
                for (const target of module.targets) {
                    pulsesToProcess.push({
                        origin: module.name,
                        pulse: 'L',
                        target
                    })
                }
                world.lowPulses += module.targets.length
                break;
            }

            case 'FF': {
                // do different things depending on the state and pulse
                if (pulseSent.pulse === 'L') {
                    // flip the state
                    module.state = module.state === 'off' ? 'on' : 'off'

                    // depending on the state, send pulses to targets
                    for (const target of module.targets) {
                        pulsesToProcess.push({
                            origin: module.name,
                            pulse: module.state === 'on' ? 'H' : 'L',
                            target
                        })
                        if (module.state === 'on') {
                            world.highPulses += 1
                        } else {
                            world.lowPulses += 1
                        }

                    }
                }
                break; // ignore high pulse sent
            }

            case 'C': {
                // update internal input state based on origin
                module.inputs[pulseSent.origin] = pulseSent.pulse

                // if all are high, send low, otherwise send high
                let isAllHigh = true
                for (const origin in module.inputs) {
                    if (module.inputs[origin] === 'L') {
                        isAllHigh = false
                        break
                    }
                }

                for (const target of module.targets) {
                    pulsesToProcess.push({
                        origin: module.name,
                        target,
                        pulse: isAllHigh ? 'L' : 'H'
                    })
                    if (isAllHigh) {
                        world.lowPulses += 1
                    } else {
                        world.highPulses += 1
                    }
                }
                break;
            }

            case 'DUMMY': {
                if (pulseSent.pulse === 'L') {
                    module.lowPulses += 1
                } else {
                    module.highPulses += 1
                }

                break;
            }

        }

    }

    return world;
}

export default () => {
    const world: World = {
        modules: {
            output: {
                type: 'DUMMY',
                name: 'output',
                lowPulses: 0,
                highPulses: 0
            },
            rx: {
                type: 'DUMMY',
                name: 'rx',
                lowPulses: 0,
                highPulses: 0
            }
        },
        highPulses: 0,
        lowPulses: 0
    }

    const conjunctionModules: ConjunctionModule[] = []
    for (const line of input.split('\n')) {
        const { groups } = /^(?<modType>[\%\&])?(?<name>[a-z]+) -> (?<targetsStr>.*)$/.exec(line) || {}
        if (!groups?.name || !groups.targetsStr) {
            throw new Error(`Could not parse ${line}`)
        }

        const { modType, name, targetsStr } = groups
        const targets = targetsStr.split(',').map(_ => _.trim())
        if (!modType) {
            world.modules[name] = {
                name,
                ...(name === 'broadcaster' ?
                    { type: 'BR', targets } :
                    { type: 'DUMMY', lowPulses: 0, highPulses: 0 }
                )
            }
        } else if (modType === '%') {
            world.modules[name] = {
                name,
                type: 'FF',
                state: 'off',
                targets
            }
        } else if (modType === '&') {
            const module: ConjunctionModule = {
                name,
                type: 'C',
                inputs: {},
                targets
            }
            world.modules[name] = module
            conjunctionModules.push(module)
        }
    }

    for (const conjunctionModule of conjunctionModules) {
        for (const moduleName in world.modules) {
            const module = world.modules[moduleName]
            if (module.type === 'FF' || module.type === 'C' || module.type === 'BR') {
                const moduleTargets = module.targets
                if (module.targets.includes(conjunctionModule.name)) {
                    // initialize that conjunction with an input, low pulse
                    conjunctionModule.inputs[module.name] = 'L'
                }
            }

        }
    }

    // console.log(JSON.stringify(world.modules, null, 2))

    for (let presses = 0; presses < 1000; presses += 1) {
        console.log(ansiColors.whiteBright(`Button Press ${presses + 1}`))
        pressButton(world)
        console.log(JSON.stringify(world, null, 2))
    }

    return world.highPulses * world.lowPulses
}
