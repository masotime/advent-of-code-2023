import input from './input'

const lines = input.split('\n')
const symbols: string[] = []
const NOT_SYMBOL = /[0-9\.]/

for (const line of lines) {
  const chars = line.split('')

  for (const char of chars) {
    if (!NOT_SYMBOL.test(char) && !symbols.includes(char)) {
      symbols.push(char)
    }
  }
}

console.log(symbols)
