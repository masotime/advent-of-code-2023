export function sum(args: number[]): number {
    return args.reduce((acc, num) => acc + num, 0)
}

export function product(args: number[]): number {
    return args.reduce((acc, num) => acc * num, 1)
}