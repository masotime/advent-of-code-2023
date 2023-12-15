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

const REGEX = /^(?<label>[^=-]+)(?<op>[=-])(?<focal>[0-9]+)?$/
type LabeledLens = {
    lens: string,
    value: number
}
type Boxes = {
    [index in number]: LabeledLens[]
}

export default () => {
    const sequence = input.split(',')
    const boxes: Boxes = {}

    let sum = 0
    for (const step of sequence) {
        const { groups } = REGEX.exec(step) || {}

        if (!groups?.label || !groups.op) {
            throw new Error(`wtf is ${step}`)
        } else if (groups.op === '=' && !groups.focal) {
            throw new Error(`wtf is ${step} - no focal?`)
        }

        const { label: labelStr, op, focal: focalStr } = groups
        const label = runHashAlgorithm(labelStr)
        const focal = parseInt(focalStr, 10)

        console.log(`\nAfter "${step}", (label = ${label}):`)
        if (!boxes[label]) {
            boxes[label] = []
        }
        const box = boxes[label] // LabeledLens array
        const lensLabelIdx = box.findIndex(({ lens }) => lens === labelStr)
        switch (op) {
            case '-': {
                if (lensLabelIdx !== -1) {
                    box.splice(lensLabelIdx, 1)
                }
                break;
            }
            case '=': {
                if (lensLabelIdx !== -1) {
                    // replace the old lens - this will have the new focal length
                    box[lensLabelIdx].value = focal
                } else {
                    // add it to the end
                    box.push({ lens: labelStr, value: focal })
                }
                break;
            }
        }

        // console.log(JSON.stringify(boxes, null, 2))
        // show the contents
        for (let i = 0; i < 256; i += 1) {
            if (boxes[i] && boxes[i].length > 0) {
                const output = boxes[i].reduce((acc, { lens, value}) => {
                    return acc + ` [${lens} ${value}]`
                }, '')
                console.log(`Box ${i}: ${output}`)
            }
        }
        
    }

    // now work out the focusing power
    let totalFocusingPower = 0
    for (let b = 0; b < 256; b += 1) {
        const box = boxes[b]
        const boxNumber = b + 1
        if (!box || box.length === 0) {
            continue
        }

        for (let slot = 0; slot < box.length; slot += 1) {
            const slotNumber = slot + 1
            const focalLength = box[slot].value
            const lens = box[slot].lens
            const focusingPower = boxNumber * slotNumber * focalLength
            console.log(`${lens}: ${boxNumber} (box ${b}) * ${slotNumber} (slot ${slot}) * ${focalLength} (focal length) = ${focusingPower}`)
            totalFocusingPower += focusingPower
        }
    }

    return totalFocusingPower
}
