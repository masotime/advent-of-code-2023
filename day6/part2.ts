import input from './input';

export default () => {
    const [timeStr, distanceRecordStr] = input.split('\n').map(line => line.split(':')[1].trim())

    const time = parseInt(timeStr.replaceAll(/\s/g, ''), 10)
    const distanceRecord = parseInt(distanceRecordStr.replaceAll(/\s/g, ''), 10)

    const lowerBound = Math.floor((time - Math.sqrt(time ** 2 - 4 * distanceRecord)) / 2) + 1
    const upperBound = Math.ceil((time + Math.sqrt(time ** 2 - 4 * distanceRecord)) / 2) - 1
    const ways = upperBound - lowerBound + 1

    console.log({ time, distanceRecord, lowerBound, upperBound, ways})

    return 'TBD'
    
}
