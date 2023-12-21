import ansiColors from 'ansi-colors';
import input from './input';
import { lcmArray } from '../utils';

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
    targets: string[],
    sources: string[]
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
    sources: string[],
    lowPulses: number,
    highPulses: number
}

type World = {
    modules: {
        [name in string]: Module
    },
    ffModules: FlipFlopModule[],
    ffMap: { [name in string]: number[] }
    cMap: { [name in string]: number[] }
    highPulses: number,
    lowPulses: number,
    presses: number
}

type PulseSent = {
    origin: string,
    target: string,
    pulse: Pulse
}

function pressButton(world: World): World {
    world.lowPulses += 1
    world.presses += 1
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

                    // keep track of this flip flip  
                    if (!world.ffMap[module.name]) {
                        world.ffMap[module.name] = []
                        world.ffModules.unshift(module)
                    }

                    // track whenever it turns on
                    if (module.state === 'on') {
                        world.ffMap[module.name].push(world.presses)
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
                        world.cMap[module.name] = world.cMap[module.name] || []
                        world.cMap[module.name].push(world.presses)
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

function decorateModule(name: string, w: World): string {
    const module = w.modules[name]
    const typeIcon = module.type === 'FF' ? '🎚️' : module.type === 'C' ? '🎛️' : module.type === 'BR' ? '📣' : '🗑️'
    return `${typeIcon}  ${name}`
}

function renderModule(name: string, w: World): string {
    const m = w.modules[name]
    let output = `${ansiColors.whiteBright(decorateModule(name, w))}: `

    switch (m.type) {
        case 'BR':
            output += `--out(LOW)--> ${m.targets.join(',')}`
            break;
        case 'FF':
            output += `${ansiColors.magentaBright(m.state)} <--in-- ${ansiColors.yellowBright(m.sources.map(name => decorateModule(name, w)).join(','))} --out--> ${ansiColors.redBright(m.targets.map(name => decorateModule(name, w)).join(','))}`
            break;
        case 'C':
            output += `<--in-- ${Object.keys(m.inputs).map(name => m.inputs[name] === 'H' ? ansiColors.cyanBright(decorateModule(name, w)) : ansiColors.gray(decorateModule(name, w))).join('|')} --out--> ${ansiColors.redBright(m.targets.map(name => decorateModule(name, w)).join(','))}`
            break;
        case 'DUMMY':
            output += `${ansiColors.whiteBright('OUTPUT')} <--in-- ${m.sources.map(name => decorateModule(name, w)).join(',')} HIGH: ${m.highPulses}, LOW: ${m.lowPulses}`
    }

    return output;
}

function renderWorldModules(w: World): string {
    // render from objective in reverse
    let output = ''
    const modulesToRender: Module[] = []
    const outputModule = Object.values(w.modules).find(module => module.type === 'DUMMY')

    if (!outputModule) {
        throw new Error(`No output module found`)
    }

    modulesToRender.push(outputModule)
    const modulesRendered: { [name in string]: boolean } = {}

    while (modulesToRender.length > 0) {
        const module = modulesToRender.shift()!

        if (modulesRendered[module.name]) {
            console.log(`Cycle detected. Module ${decorateModule(module.name, w)} was already rendered, but is an input to another module.`)
            continue;
        }
        output += renderModule(module.name, w) + '\n'
        modulesRendered[module.name] = true
        switch (module.type) {
            case 'FF':
                modulesToRender.push(...module.sources.map(name => w.modules[name]))
                break;
            case 'BR':
                // do nothing, we are at an end
                break;
            case 'C':
                modulesToRender.push(...Object.keys(module.inputs).map(name => w.modules[name]))
                break;
            case 'DUMMY':
                // initial
                modulesToRender.push(...module.sources.map(name => w.modules[name]))
        }
    }

    return output
}

export default () => {
    const world: World = {
        modules: {},
        highPulses: 0,
        lowPulses: 0,
        ffModules: [],
        ffMap: {},
        cMap: {},
        presses: 0
    }

    for (const line of input.split('\n')) {
        const { groups } = /^(?<modType>[\%\&])?(?<name>[a-z]+) -> (?<targetsStr>.*)$/.exec(line) || {}
        if (!groups?.name || !groups.targetsStr) {
            throw new Error(`Could not parse ${line}`)
        }

        const { modType, name, targetsStr } = groups
        const targets = targetsStr.split(',').map(_ => _.trim())
        if (!modType && name === 'broadcaster') {
            world.modules.broadcaster = { name, type: 'BR', targets }
        } else if (modType === '%') {
            const ffModule: FlipFlopModule = {
                name,
                type: 'FF',
                state: 'off',
                targets,
                sources: []
            }
            world.modules[name] = ffModule
        } else if (modType === '&') {
            const cModule: ConjunctionModule = {
                name,
                type: 'C',
                inputs: {},
                targets
            }
            world.modules[name] = cModule
        }
    }

    let outputModuleName: string | undefined = undefined
    for (const moduleName in world.modules) {
        const module = world.modules[moduleName]
        if (module.type === 'FF' || module.type === 'C' || module.type === 'BR') {
            // just annotate all targets with their source
            for (const targetName of module.targets) {
                const target = world.modules[targetName]
                if (!target) { // we found an output module
                    outputModuleName = targetName
                    world.modules[targetName] = {
                        type: 'DUMMY',
                        name: targetName,
                        lowPulses: 0,
                        highPulses: 0,
                        sources: [module.name]
                    }
                } else if (target.type === 'C') {
                    // initialize that conjunction with an input, low pulse
                    target.inputs[module.name] = 'L'
                } else if (target.type === 'DUMMY' || target.type === 'FF') {
                    target.sources.push(module.name)
                }
            }
        }

    }

    if (!outputModuleName) {
        throw new Error(`No output module?`)
    }

    console.log(renderWorldModules(world))

    // Brute force code that would never have worked
    // while (world.modules[outputModuleName].type === 'DUMMY' && world.modules[outputModuleName].lowPulses !== 1) {
    //     presses += 1
    //     pressButton(world)

    //     if (presses % 1000000 === 0) {
    //         console.log(presses + 1, world.ffModules.reduce((acc, module) => `${acc}${module.state === 'off' ? '0' : '1'}`, ''))
    //     }
    // }

    // simulation to unearth patterns
    for (let presses = 0; presses < 100000; presses += 1) {
        pressButton(world)
    }

    // didn't really use code to solve it, but observed that I just need to find repeating patterns for
    // these conjunctions (gf, vc, db, qx) by checking backwards on rx requirements.
    /**
     * 🗑️  rx: OUTPUT <--in-- 🎛️  th HIGH: 0, LOW: 0
     * 🎛️  th: <--in-- 🎛️  xn|🎛️  qn|🎛️  xf|🎛️  zl --out--> 🗑️  rx
     * 🎛️  xn: <--in-- 🎛️  gf --out--> 🎛️  th
     * 🎛️  qn: <--in-- 🎛️  vc --out--> 🎛️  th
     * 🎛️  xf: <--in-- 🎛️  db --out--> 🎛️  th
     * 🎛️  zl: <--in-- 🎛️  qx --out--> 🎛️  th
     * 🎛️  gf: <--in-- 🎚️  zd|🎚️  qq|🎚️  fn|🎚️  tj|🎚️  ln|🎚️  vl|🎚️  sr|🎚️  lc|🎚️  gm|🎚️  pr --out--> 🎚️  fj,🎚️  qm,🎛️  xn,🎚️  sr
     * 🎛️  vc: <--in-- 🎚️  vz|🎚️  qk|🎚️  sb|🎚️  cr|🎚️  pm|🎚️  cd|🎚️  hd --out--> 🎚️  lr,🎚️  hd,🎚️  ks,🎛️  qn,🎚️  gx,🎚️  nh,🎚️  hv
     * 🎛️  db: <--in-- 🎚️  pl|🎚️  xm|🎚️  nn|🎚️  qj|🎚️  mc|🎚️  jz|🎚️  ch|🎚️  bp --out--> 🎚️  ff,🎚️  ds,🎚️  sf,🎚️  ch,🎚️  cc,🎛️  xf
     * 🎛️  qx: <--in-- 🎚️  kt|🎚️  bf|🎚️  jd|🎚️  bx|🎚️  cl|🎚️  qp|🎚️  pf|🎚️  rz --out--> 🎚️  cb,🎚️  cv,🎚️  bx,🎚️  xz,🎚️  vm,🎛️  zl
     */
    for (const keyModule of ['gf', 'vc', 'db', 'qx']) {
        console.log(keyModule, new Set(world.cMap[keyModule]))
    }

    return lcmArray([world.cMap.gf[0], world.cMap.vc[0], world.cMap.db[0], world.cMap.qx[0]])
}
