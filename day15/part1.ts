import input from './input';

function runHashAlgorithm(s: string): number {
    const codes: number[] = []
    for (let c = 0; c < s.length; c += 1) {
        codes[c] = s.charCodeAt(c)
    }

    let currValue = 0
    for (const code of codes) {
        currValue += code
        currValue *= 17
        currValue = currValue % 256
    }

    return currValue
}
export default () => {
    const sequence = input.split(',')
    let sum = 0
    for (const step of sequence) {
        const hash = runHashAlgorithm(step)
        console.log(step, hash)
        sum += hash
    }

    return sum
}
