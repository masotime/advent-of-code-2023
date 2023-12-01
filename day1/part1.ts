import input from './input';

export default () => {
    const lines = input.split('\n');
    const filtered = lines.map(line => {
        const numbers = line.split('').filter(char => char.match(/[0-9]/))
        const first = numbers[0]
        const last = numbers[numbers.length - 1]
        return parseInt(`${first}${last}`, 10)
    })
    const sum = filtered.reduce((acc, num) => acc + num, 0)
    return sum;
}
