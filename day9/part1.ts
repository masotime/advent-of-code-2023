import input from './input';


function getDiff(sequence: number[]): number[] {
    let result = []
    for (let i = 0; i < sequence.length - 1; i += 1) {
        result.push(sequence[i + 1] - sequence[i])
    }
    return result
}

function solve(n: number, coefficients: number[]) {
    // number sequence theory
    let numerator = 1;
    let denominator = 1;
    let sum = coefficients[0]
    for (let c = 1; c < coefficients.length; c += 1) {
        numerator *= (n - c)
        denominator *= (c)
        sum += coefficients[c] * numerator / denominator
    }

    return sum
}

export default () => {
    const lines = input.split('\n')
    let total = 0
    for (const line of lines) {
        let sequence = line.split(' ').map(num => parseInt(num, 10))
        let start = sequence[0]
        let n = sequence.length + 1
        let coefficients = [sequence[0]]
        while (sequence.length > 1 && !sequence.every(num => num === 0)) {
            console.log(sequence)
            console.log(coefficients[coefficients.length - 1])
            sequence = getDiff(sequence)
            coefficients.push(sequence[0])
        }
        let nextNum = solve(n, coefficients)
        console.log('next number', nextNum)
        total += nextNum
        console.log('-----')

    }

    return total

}
