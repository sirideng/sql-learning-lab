export interface EditorPairEdit {
  value: string
  selectionStart: number
  selectionEnd: number
}

const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
  '`': '`',
}

const CLOSING_CHARACTERS = new Set(Object.values(PAIRS))

export function getEditorPairEdit(value: string, selectionStart: number, selectionEnd: number, key: string): EditorPairEdit | null {
  if (key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
    const opening = value[selectionStart - 1]
    const closing = value[selectionStart]
    if (PAIRS[opening] === closing) {
      return {
        value: `${value.slice(0, selectionStart - 1)}${value.slice(selectionStart + 1)}`,
        selectionStart: selectionStart - 1,
        selectionEnd: selectionStart - 1,
      }
    }
    return null
  }

  const closing = PAIRS[key]
  if (closing) {
    if (selectionStart === selectionEnd && key === closing && value[selectionStart] === closing) {
      return { value, selectionStart: selectionStart + 1, selectionEnd: selectionStart + 1 }
    }

    const selectedText = value.slice(selectionStart, selectionEnd)
    return {
      value: `${value.slice(0, selectionStart)}${key}${selectedText}${closing}${value.slice(selectionEnd)}`,
      selectionStart: selectionStart + 1,
      selectionEnd: selectionEnd + 1,
    }
  }

  if (selectionStart === selectionEnd && CLOSING_CHARACTERS.has(key) && value[selectionStart] === key) {
    return { value, selectionStart: selectionStart + 1, selectionEnd: selectionStart + 1 }
  }

  return null
}
