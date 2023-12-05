import input from './input';

const RANGE_REGEX = /^(?<destStart>\d+) (?<sourceStart>\d+) (?<rangeLength>\d+)$/

type MapperDefinition = {
    sourceStart: number,
    destStart: number,
    rangeLength: number
}

type MapperResult = {
    name: string
    target: number
}

type World = {
    seeds: number[],
    seedSoil: Mapper,
    soilFertilizer: Mapper,
    fertilizerWater: Mapper,
    waterLight: Mapper,
    lightTemperature: Mapper,
    temperatureHumidity: Mapper,
    humidityLocation: Mapper
}

class Mapper {
    #definitions: MapperDefinition[] = []
    #mapperName: string

    constructor(mapperName: string) {
        this.#mapperName = mapperName
    }

    addDefinition(input: string) {
        const { groups } = RANGE_REGEX.exec(input) ?? {}

        if (groups?.destStart === undefined || groups?.sourceStart === undefined || groups?.rangeLength === undefined) {
            throw new Error(`Could not parse ${input} to determine mapper`)
        }

        this.#definitions.push({
            sourceStart: parseInt(groups.sourceStart, 10),
            destStart: parseInt(groups.destStart, 10),
            rangeLength: parseInt(groups.rangeLength, 10)
        })
    }

    getDestination(sourceNumber: number): number {
        // run through all definitions and keep trying to get a match
        let target: number | undefined = undefined
        for (const definition of this.#definitions) {
            const { sourceStart, destStart, rangeLength } = definition
            if (sourceNumber >= sourceStart && sourceNumber < sourceStart + rangeLength) {
                // map the value
                target = destStart + (sourceNumber - sourceStart)
                break;
            }
        }

        if (target === undefined) {
            // no mapping found, just translate directly
            target = sourceNumber
        }        
        
        return target
    }
}

type ParsePhase = 'seedSoil' | 'soilFertilizer' | 'fertilizerWater' | 'waterLight' | 'lightTemperature' | 'temperatureHumidity' | 'humidityLocation'

export default () => {    
    const lines = input.split('\n')
    const partialWorld: Partial<World> = {
        seeds: [],
        seedSoil: undefined,
        soilFertilizer: undefined,
        fertilizerWater: undefined,
        waterLight: undefined,
        lightTemperature: undefined,
        temperatureHumidity: undefined,
        humidityLocation: undefined
    }

    let phase: ParsePhase | undefined  = undefined

    for (const line of lines) {
        const [left, right] = line.split(':')
        switch (left) {
            case 'seeds':
                // just extract the data
                partialWorld.seeds = right.split(' ').filter(_ => _.trim()).map(numStr => parseInt(numStr, 10))
                break;
            case 'seed-to-soil map':
                phase = 'seedSoil'
                break;
            case 'soil-to-fertilizer map':
                phase = 'soilFertilizer'
                break;
            case 'fertilizer-to-water map':
                phase = 'fertilizerWater'
                break;
            case 'water-to-light map':
                phase = 'waterLight'
                break;
            case 'light-to-temperature map':
                phase = 'lightTemperature'
                break;
            case 'temperature-to-humidity map':
                phase = 'temperatureHumidity'
                break;
            case 'humidity-to-location map':
                phase = 'humidityLocation'
                break;
            default:
                // either an empty line or numbers
                if (left !== '' && phase) {                    
                    // construct the map
                    partialWorld[phase] ??= new Mapper(phase)
                    partialWorld[phase]?.addDefinition(left)
                }
        }
    }
    
    const world: World = partialWorld as World

    console.log(world)

    // now find the mappins
    let lowest = Number.MAX_SAFE_INTEGER
    let count = 0;
    for (const seed of world.seeds) {
        const soil = world.seedSoil.getDestination(seed)
        const fertilizer = world.soilFertilizer.getDestination(soil)
        const water = world.fertilizerWater.getDestination(fertilizer)
        const light = world.waterLight.getDestination(water)
        const temperature = world.lightTemperature.getDestination(light)
        const humidity = world.temperatureHumidity.getDestination(temperature)
        const location = world.humidityLocation.getDestination(humidity)

        // console.log(
        //     [
        //         `Seed ${seed}`,            
        //         `soil ${soil}`,
        //         `fertilizer ${fertilizer}`,
        //         `water ${water}`,
        //         `light ${light}`,
        //         `temperature ${temperature}`,
        //         `humidity ${humidity}`,
        //         `location ${location}`,
        //     ].join(', ')
        // )
        
        lowest = Math.min(lowest, location)
    }
    return lowest
}
