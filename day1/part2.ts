import input from './input';

const possibilities = [
    ['one', 1],
    ['two', 2],
    ['three', 3],
    ['four', 4],
    ['five', 5],
    ['six', 6],
    ['seven', 7],
    ['eight', 8],
    ['nine', 9]
] as const

function getNumber(input: string): number | undefined {
    for (const [word, digit] of possibilities) {
        if (input.startsWith(word) || input.endsWith(word)) return digit
    }
    return undefined

}

function getFirstAndLast(input: string): { first: number, last: number } {
    // this shit is tricky because words can be merged like
    // "eightwo" is actually 8wo and not eigh2
    //
    // there can also be other stuff like fiveeightwo
    // which is really 5eigh2
    const parts = input.split('')
    
    // find the first match
    let first = -1
    let index = 0
    let acc = ''
    while (index < input.length) {
        // simple case - we find a digit
        const char = input[index]
        if (char.match(/[0-9]/)) {
            first = parseInt(char, 10);
            break;
        }

        // next case - we find a word
        acc += input[index]
        let possibility = getNumber(acc)
        if (possibility) {
            first = possibility
            break
        }

        index += 1
    }

    // find the last match - count backwards
    let last = -1
    index = input.length - 1
    acc = ''
    while (index >= 0) {
        // simple case - we find a digit
        const char = input[index]
        if (char.match(/[0-9]/)) {
            last = parseInt(char, 10);
            break;
        }

        // next case - we find a word
        acc = input[index] + acc // note how the addition works here
        let possibility = getNumber(acc)
        if (possibility) {
            last = possibility
            break
        }
        index -= 1
    }

    if (first === -1 || last === -1) {
        console.error({ first, last })
        throw new Error(`Failed on ${input}`)
    }

    return { first, last }
}

export default () => {
    const lines = input.split('\n');
    const firstAndLast = lines.map(line => {
        const { first, last } = getFirstAndLast(line)
        return first * 10 + last
    })
    console.log({ firstAndLast })
    const sum = firstAndLast.reduce((acc, num) => acc + num, 0)
    return sum;

}
