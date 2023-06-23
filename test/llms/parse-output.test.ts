import test from 'ava'
import { z } from 'zod'

import {
  extractJSONFromString,
  parseArrayOutput,
  parseBooleanOutput,
  parseNumberOutput,
  parseObjectOutput,
  parseOutput
} from '@/llms/parse-output'

test('extractJSONFromString should extract JSON object from string', (t) => {
  let jsonStr = 'Some text {"name":"John Doe"} more text'
  let result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], { name: 'John Doe' })

  jsonStr =
    'Some text {"name":"John Doe","age":42,"address":{"street":"Main Street","number":42}} more text'
  result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], {
    name: 'John Doe',
    age: 42,
    address: { street: 'Main Street', number: 42 }
  })

  jsonStr = 'foo {"name":"John Doe","school":"St. John\'s"} bar'
  result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], { name: 'John Doe', school: "St. John's" })
})

test('extractJSONFromString should extract an invalid JSON object from string', (t) => {
  let jsonStr = 'Some text {"name":\'John Doe\'} more text'
  let result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], { name: 'John Doe' })

  jsonStr = 'Some text {"name":"John Doe","age":42,} more text'
  result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], { name: 'John Doe', age: 42 })
})

test('extractJSONFromString should extract multiple JSON objects from string', (t) => {
  let jsonStr = 'Some text {"name":"John Doe"} more text {"name":"Jane Doe"}'
  let result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], { name: 'John Doe' })
  t.deepEqual(result[1], { name: 'Jane Doe' })

  jsonStr =
    'Some text {"name":"John Doe","age":42,"address":{"street":"Main Street","number":42}} more text {"name":"Jane Doe","age":42,"address":{"street":"Main Street","number":42}}'
  result = extractJSONFromString(jsonStr, 'object')
  t.deepEqual(result[0], {
    name: 'John Doe',
    age: 42,
    address: { street: 'Main Street', number: 42 }
  })
  t.deepEqual(result[1], {
    name: 'Jane Doe',
    age: 42,
    address: { street: 'Main Street', number: 42 }
  })
})

test('extractJSONFromString should extract JSON array from string', (t) => {
  let jsonString = 'Some text [1,2,3] more text'
  let result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result[0], [1, 2, 3])

  jsonString = 'Some text ["foo","bar","\'quoted\'"] more text'
  result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result[0], ['foo', 'bar', "'quoted'"])
})

test('extractJSONFromString should extract an invalid JSON array from string', (t) => {
  let jsonString = 'Some text [1,2,3,] more text'
  let result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result[0], [1, 2, 3])

  jsonString = "Some text ['foo','bar'] more text"
  result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result[0], ['foo', 'bar'])
})

test('extractJSONFromString should extract multiple JSON arrays from string', (t) => {
  const jsonString = 'Some text [1,2,3] more text [4,5,6]'
  const result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result[0], [1, 2, 3])
  t.deepEqual(result[1], [4, 5, 6])
})

test('extractJSONFromString should return an empty array if no JSON object is found', (t) => {
  const jsonString = 'Some text'
  const result = extractJSONFromString(jsonString, 'object')
  t.deepEqual(result, [])
})

test('extractJSONFromString should return an empty array if no JSON array is found', (t) => {
  const jsonString = 'Some text'
  const result = extractJSONFromString(jsonString, 'array')
  t.deepEqual(result, [])
})

test('parseArrayOutput - handles valid arrays correctly', (t) => {
  const output1 = parseArrayOutput('[1,2,3]')
  const output2 = parseArrayOutput('["a", "b", "c"]')
  const output3 = parseArrayOutput('[{"a": 1}, {"b": 2}]')

  t.snapshot(output1, 'should return [1, 2, 3] for "[1,2,3]"')
  t.snapshot(output2, 'should return ["a", "b", "c"] for "["a", "b", "c"]')
  t.snapshot(
    output3,
    'should return [{"a": 1}, {"b": 2}] for [{"a": 1}, {"b": 2}]'
  )
})

test('parseArrayOutput - handles arrays surrounded by text correctly', (t) => {
  const output1 = parseArrayOutput('The array is [1,2,3]')
  const output2 = parseArrayOutput('Array: ["a", "b", "c"]. That\'s all!')
  const output3 = parseArrayOutput(
    'This is the array [{"a": 1}, {"b": 2}] in the text'
  )

  t.snapshot(output1, 'should return [1, 2, 3] for "The array is [1,2,3]"')
  t.snapshot(
    output2,
    'should return ["a", "b", "c"] for "Array: ["a", "b", "c"]. That\'s all!"'
  )
  t.snapshot(
    output3,
    'should return [{"a": 1}, {"b": 2}] for "This is the array [{"a": 1}, {"b": 2}] in the text"'
  )
})

test('parseArrayOutput - throws error for invalid arrays', (t) => {
  const error = t.throws(
    () => {
      parseArrayOutput('not a valid array')
    },
    { instanceOf: Error }
  )

  t.snapshot(error?.message)
})

test('parseObjectOutput - handles valid objects correctly', (t) => {
  const output1 = parseObjectOutput('{"a":1,"b":2,"c":3}')
  const output2 = parseObjectOutput(
    '{"name":"John","age":30,"city":"New York"}'
  )

  t.snapshot(
    output1,
    'should return {"a":1,"b":2,"c":3} for {"a":1,"b":2,"c":3}'
  )
  t.snapshot(
    output2,
    'should return {"name":"John","age":30,"city":"New York"} for {"name":"John","age":30,"city":"New York"}'
  )
})

test('parseObjectOutput - handles objects surrounded by text correctly', (t) => {
  const output1 = parseObjectOutput('The object is {"a":1,"b":2,"c":3}')
  const output2 = parseObjectOutput(
    'Object: {"name":"John","age":30,"city":"New York"}. That\'s all!'
  )

  t.snapshot(
    output1,
    'should return {"a":1,"b":2,"c":3} for "The object is {"a":1,"b":2,"c":3}"'
  )
  t.snapshot(
    output2,
    'should return {"name":"John","age":30,"city":"New York"} for "Object: {"name":"John","age":30,"city":"New York"}. That\'s all!"'
  )
})

test('parseObjectOutput - handles JSON array of objects', (t) => {
  const output = parseObjectOutput('[{"a":1,"b":2},{"c":3,"d":4}]')

  t.snapshot(
    output,
    'should return first object {"a":1,"b":2} for [{"a":1,"b":2},{"c":3,"d":4}]'
  )
})

test('parseObjectOutput - throws error for invalid objects', (t) => {
  const error = t.throws(
    () => {
      parseObjectOutput('not a valid object')
    },
    { instanceOf: Error }
  )

  t.snapshot(error?.message)
})

test('parseBooleanOutput - handles `true` outputs correctly', (t) => {
  const output1 = parseBooleanOutput('True')
  const output2 = parseBooleanOutput('TRUE')
  const output3 = parseBooleanOutput('true.')

  t.snapshot(output1, 'should return true for "True"')
  t.snapshot(output2, 'should return true for "TRUE"')
  t.snapshot(output3, 'should return true for "true."')
})

test('parseBooleanOutput - handles `false` outputs correctly', (t) => {
  const output1 = parseBooleanOutput('False')
  const output2 = parseBooleanOutput('FALSE')
  const output3 = parseBooleanOutput('false!')

  t.snapshot(output1, 'should return false for "False"')
  t.snapshot(output2, 'should return false for "FALSE"')
  t.snapshot(output3, 'should return false for "false!"')
})

test('parseBooleanOutput - throws error for invalid outputs', (t) => {
  const error = t.throws(
    () => {
      parseBooleanOutput('NotBooleanValue')
    },
    { instanceOf: Error }
  )

  t.snapshot(error?.message)
})

test('parseNumberOutput - handles integer outputs correctly', (t) => {
  const output1 = parseNumberOutput('42', z.number().int())
  const output2 = parseNumberOutput('  -5 ', z.number().int())

  t.snapshot(output1, 'should return 42 for "42"')
  t.snapshot(output2, 'should return -5 for "  -5 "')
})

test('parseNumberOutput - handles float outputs correctly', (t) => {
  const output1 = parseNumberOutput('42.42', z.number())
  const output2 = parseNumberOutput('   -5.5 ', z.number())

  t.snapshot(output1, 'should return 42.42 for "42.42"')
  t.snapshot(output2, 'should return -5.5 for "   -5.5 "')
})

test('parseNumberOutput - throws error for invalid outputs', (t) => {
  const error = t.throws(
    () => {
      parseNumberOutput('NotANumber', z.number())
    },
    { instanceOf: Error }
  )

  t.snapshot(error?.message)
})

test('parseOutput - handles arrays correctly', (t) => {
  const arraySchema = z.array(z.number())
  const output = '[1, 2, 3]'
  const result = parseOutput(output, arraySchema)

  t.snapshot(result, 'should parse and return [1, 2, 3] for "[1, 2, 3]"')
})

test('parseOutput - handles objects correctly', (t) => {
  const objectSchema = z.object({ a: z.number(), b: z.string() })
  const output = '{"a": 1, "b": "two"}'
  const result = parseOutput(output, objectSchema)

  t.snapshot(
    result,
    'should parse and return {"a": 1, "b": "two"} for "{"a": 1, "b": "two"}"'
  )
})

test('parseOutput - handles booleans correctly', (t) => {
  const booleanSchema = z.boolean()
  const output = 'True'
  const result = parseOutput(output, booleanSchema)

  t.snapshot(result, 'should parse and return true for "True"')
})

test('parseOutput - handles numbers correctly', (t) => {
  const numberSchema = z.number()
  const output = '123.45'
  const result = parseOutput(output, numberSchema)

  t.snapshot(result, 'should parse and return 123.45 for "123.45"')
})

test('parseOutput - throws error for invalid data', (t) => {
  const numberSchema = z.number()
  const output = 'not a number'

  const error = t.throws(
    () => {
      parseOutput(output, numberSchema)
    },
    { instanceOf: Error }
  )

  t.snapshot(error?.message)
})
