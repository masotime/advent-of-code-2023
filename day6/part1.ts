import input from './input';

type Race = {
    time: number,
    distanceRecord: number
}
export default () => {
    const [timeStr, distanceRecordStr] = input.split('\n').map(line => line.split(':')[1].trim())
    const races: Race[] = []

    const times = timeStr.split(/\s+/).map(time => parseInt(time, 10))
    const distanceRecords = distanceRecordStr.split(/\s+/).map(distanceRecord => parseInt(distanceRecord, 10))

    for (let i = 0; i < times.length; i += 1) {
        races.push( { time: times[i], distanceRecord: distanceRecords[i] })
    }

    console.log(races)

    // use math to solve
    // all integers between (time - sqrt(time^2 - 4 * record) / 2) and (time + sqrt(time^2 - 4 * record) / 2)
    let waysToWinProduct = 1
    for (let r = 0; r < races.length; r += 1) {
        const race = races[r]
        const { time, distanceRecord } = race
        const lowerBound = Math.floor((time - Math.sqrt(time ** 2 - 4 * distanceRecord)) / 2) + 1
        const upperBound = Math.ceil((time + Math.sqrt(time ** 2 - 4 * distanceRecord)) / 2) - 1
        const waysToWin = upperBound - lowerBound + 1
        waysToWinProduct *= waysToWin
        console.log(`For race #${r+1}, there are ${waysToWin} ways to win, with charge times from ${lowerBound} to ${upperBound}`)
    }

    return waysToWinProduct
}
