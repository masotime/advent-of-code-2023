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

    /**
     * Returns a sorted array of ranges ordered by destination
     */
    getPreferredRanges(): MapperDefinition[] {
        const tempRanges = [...this.#definitions]
        const starts = this.#definitions.map(({ sourceStart }) => sourceStart)
        if (!this.#definitions.some(({ sourceStart }) => sourceStart === 0)) {
            
            tempRanges.push({
                destStart: 0,
                sourceStart: 0,
                rangeLength: Math.min(...starts)
            })
        }        

        // find the outer range
        const maxSource = Math.max(...this.#definitions.map(({ sourceStart, rangeLength }) => sourceStart + rangeLength))
        tempRanges.push({ sourceStart: maxSource, destStart: maxSource, rangeLength: Number.MAX_SAFE_INTEGER})

        // fill in any gaps found in the ranges
        tempRanges.sort((a,b) => a.sourceStart - b.sourceStart)
        const moreRanges: MapperDefinition[] = []
        for (const range of tempRanges) {
            const next = range.sourceStart + range.rangeLength
            const adjacentRange = tempRanges.find(aRange => aRange.sourceStart === next)

            if (!adjacentRange && next < 9000000000000000) {
                console.log(`🔥 Could not find a range in ${this.#mapperName} with sourceStart = ${next}`)

                // construct a range of the appropriate size
                const upperBoundary = tempRanges.find(aRange => aRange.sourceStart > next)

                if (!upperBoundary) {
                    throw new Error('wtf')
                }
                const newRangeLength = upperBoundary.sourceStart - next                
                moreRanges.push({
                    sourceStart: next,
                    destStart: next,
                    rangeLength: newRangeLength
                })
            }
        }

        tempRanges.push(...moreRanges)

        // now sort by destination
        tempRanges.sort((a, b) => a.destStart - b.destStart)
        return tempRanges

    }
}

type ParsePhase = 'seedSoil' | 'soilFertilizer' | 'fertilizerWater' | 'waterLight' | 'lightTemperature' | 'temperatureHumidity' | 'humidityLocation'

type Range = {
    start: number,
    size: number
}

type World = {
    seeds: Range[],
    seedSoil: Mapper,
    soilFertilizer: Mapper,
    fertilizerWater: Mapper,
    waterLight: Mapper,
    lightTemperature: Mapper,
    temperatureHumidity: Mapper,
    humidityLocation: Mapper
}

function render(def: MapperDefinition) {
    return `${def.rangeLength} [${def.sourceStart} - ${def.sourceStart + def.rangeLength - 1}] => [${def.destStart} - ${def.destStart + def.rangeLength - 1}]`
}

function simpleRender(name: string, definitions: MapperDefinition[]) {
    console.log(name)
    for (const def of definitions) {
        console.log(`${def.rangeLength} [${def.sourceStart} - ${def.sourceStart + def.rangeLength - 1}] => [${def.destStart} - ${def.destStart + def.rangeLength - 1}]`)
    }
    
}

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
                const numbers = right.split(' ').filter(_ => _.trim()).map(numStr => parseInt(numStr, 10))
                if (numbers.length % 2 !== 0) {
                    throw new Error('Invalid seed ranges')
                }

                for (let r = 0; r < numbers.length; r += 2) {
                    partialWorld.seeds?.push({ start: numbers[r], size: numbers[r+1]})
                }
                
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
    
    console.log(world.seeds)
    simpleRender('humidity-location', world.humidityLocation.getPreferredRanges())
    simpleRender('temp-humidity', world.temperatureHumidity.getPreferredRanges())
    simpleRender('light-temperature', world.lightTemperature.getPreferredRanges())
    // simpleRender('water-light', world.waterLight.getPreferredRanges())
    // simpleRender('fertilizer-waster', world.fertilizerWater.getPreferredRanges())
    // simpleRender('soil-fertilizer', world.soilFertilizer.getPreferredRanges())
    // simpleRender('seed-soil', world.seedSoil.getPreferredRanges())

    const searchOrder = [world.humidityLocation, world.temperatureHumidity, world.lightTemperature, world.waterLight, world.fertilizerWater, world.soilFertilizer, world.seedSoil]
    const searchRanges = searchOrder.map(mapper => mapper.getPreferredRanges())

    function generateIntersections(fromD: MapperDefinition[], toD: MapperDefinition[]): MapperDefinition[] {
        const intersections: MapperDefinition[] = []

        let toIndex = 0
        let pointer = toD[toIndex].destStart
        do {
            // forced termination
            if (pointer > 9000000000000000 ) {
                break;
            }

            // if the pointer exceeds the current toD[toIndex] bounds, advance toIndex
            // and move the pointer to the start of it. The toIndex order must be maintained
            // since it propagates from the target
            if (pointer > toD[toIndex].destStart + toD[toIndex].rangeLength - 1) {
                toIndex += 1
                pointer = toD[toIndex].destStart
            }

            let found = false
            const sharedPointer = pointer - toD[toIndex].destStart + toD[toIndex].sourceStart
            for (const fromMapping of fromD) {                
                if (sharedPointer >= fromMapping.destStart && sharedPointer < fromMapping.destStart + fromMapping.rangeLength) {
                    const toMaxRange = toD[toIndex].rangeLength - (pointer - toD[toIndex].destStart)
                    const fromMaxRange = fromMapping.rangeLength - (sharedPointer - fromMapping.destStart)
                    const rangeLength = Math.min(toMaxRange, fromMaxRange)
                    intersections.push({
                        sourceStart: sharedPointer - fromMapping.destStart + fromMapping.sourceStart,
                        destStart: sharedPointer,
                        rangeLength
                    })
    
                    console.log({ pointer, toIndex, lastIntersection: render(intersections[intersections.length - 1]) })
                    found = true
                    break;
                }
            }

            if (!found) {
                throw new Error(`Could not find ${pointer} / ${sharedPointer} amongst the ranges defined in ${JSON.stringify(fromD, null, 2)}`)
            }

            // adjust the pointer and toIndex
            pointer += intersections[intersections.length - 1].rangeLength
        } while (!isNaN(pointer))

        return intersections
    }

    // console.log(searchRanges[0][1])

    const tempHumidity2 = generateIntersections(searchRanges[1], searchRanges[0])
    simpleRender('temp-to-humidity 2', tempHumidity2)
    const lightTemperature2 = generateIntersections(searchRanges[2], tempHumidity2)
    simpleRender('light-to-temperature 2', lightTemperature2)
    const waterLight2 = generateIntersections(searchRanges[3], lightTemperature2)
    simpleRender('water-to-light 2', waterLight2)
    const fertilizerWater2 = generateIntersections(searchRanges[4], waterLight2)
    simpleRender('fertilizer-to-water 2', fertilizerWater2)
    const soilFertilizer2 = generateIntersections(searchRanges[5], fertilizerWater2)
    simpleRender('soil-to-fertilizer 2', soilFertilizer2)
    const seedSoil2 = generateIntersections(searchRanges[6], soilFertilizer2)
    simpleRender('seed-to-soil 2', seedSoil2)

    function smallestIntersection(start1: number, length1: number, start2: number, length2: number): number | undefined {
        // Calculate the end of each range
        const end1 = start1 + length1 - 1;
        const end2 = start2 + length2 - 1;
    
        // Check if the ranges intersect
        if (start1 <= end2 && start2 <= end1) {
            // Return the maximum of the two start values, which is the smallest number in the intersection
            return Math.max(start1, start2);
        }
    
        // Return undefined if there is no intersection
        return undefined;
    }
    
    let intersection = undefined;
    world.seeds.sort((a,b) => a.start - b.start)
    for (const mapping of seedSoil2) {
        const start1 = mapping.sourceStart
        const length1 = mapping.rangeLength
        
        for (const range of world.seeds) {
            intersection = smallestIntersection(start1, length1, range.start, range.size)
            if (intersection) {
                break;
            }
        }

        if (intersection) {
            console.log('found a match', intersection)
            break;
        }

    }

    if (!intersection) {
        throw new Error('wtf')
    }

    const soil = world.seedSoil.getDestination(intersection)
    const fertilizer = world.soilFertilizer.getDestination(soil)
    const water = world.fertilizerWater.getDestination(fertilizer)
    const light = world.waterLight.getDestination(water)
    const temperature = world.lightTemperature.getDestination(light)
    const humidity = world.temperatureHumidity.getDestination(temperature)
    const location = world.humidityLocation.getDestination(humidity)
    
    return location
}
