export class Canvas {
  height: number
  width: number
  content: Array<Array<string>>
  constructor(height: number, width: number) {
    this.height = height
    this.width = width
    this.content = Array(height).fill([' '.repeat(width)])
  }
  // remove all blank lines from end of canvas
  trimDataLines = (gridLines: string[]): string[] => {
    for (let i = gridLines.length - 1; i >= 0; i--) {
      if (gridLines[i].trim().length === 0) {
        gridLines.splice(i, 1)
      } else {
        break
      }
    }
    return gridLines
  }
  getDataLines = () => {
    return this.trimDataLines(this.content.map((line) => line.join('')))
  }
  writeLine = (lineIndex: number, line: string) => {
    this.content[lineIndex] = [line]
  }
  writeAndFillLine = (lineIndex: number, line: string) => {
    this.content[lineIndex] = [line + ' '.repeat(this.width - line.length)]
  }
  splitLineIntoColumns = (lineIndex: number, columnSizes: Array<number>) => {
    if (columnSizes.reduce((a, b) => a + b, 0) > this.width)
      throw new Error('Column sizes too large')
    const line = this.content[lineIndex].join('')
    this.content[lineIndex] = columnSizes.map((size) => line.substring(0, size))
  }
  writeCell = (
    lineIndex: number,
    columnIndex: number,
    content: string = ''
  ) => {
    content = content.substring(0, this.content[lineIndex][columnIndex].length)
    content = content.padEnd(this.content[lineIndex][columnIndex].length)
    this.content[lineIndex][columnIndex] = content
  }
}
